import { useFlag } from '@unleash/proxy-client-react';
import { useEffect } from 'react';

/**
 * PF 5 and PF6 global font family has a conflict.
 * Order of loading stylesheets matters
 * The PF6 has to applied, but its always loaded first which is problematic as it gets overridden with PF5 styles.
 * This override forces the font family to be PF6 but has to be loaded after PF5 stylesheet is loaded.
 *  */
const fontFamilyOverride = `:where(body) {
    font-family: var(--pf-t--global--font--family--body);
}`;

function applyFontFamilyOverride() {
  let styleElement: HTMLStyleElement;
  try {
    styleElement = document.createElement('style');
    styleElement.id = 'pf6-font-override';
    styleElement.innerHTML = fontFamilyOverride;
    document.head.appendChild(styleElement);
    return styleElement;
  } catch (error) {
    console.error('Error applying PF6 font family override:', error);
  }
}

function usePf5Styles() {
  const flagEnabled = useFlag('platform.chrome.pf5');
  const stylesOverride = localStorage.getItem('@chrome/pf-5-enabled');
  let isEnabled = false;
  if (stylesOverride === 'true' || stylesOverride === 'false') {
    isEnabled = stylesOverride === 'true';
  } else {
    isEnabled = flagEnabled;
  }
  useEffect(() => {
    let link: HTMLLinkElement;
    let overrideStyleElement: HTMLStyleElement | undefined;
    try {
      const existingLink = document.getElementById('pf5-stylesheet');
      if (existingLink) {
        existingLink.remove();
      }
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.id = 'pf5-stylesheet';
      link.href = '/apps/chrome/js/pf/pf4-v5.css';
      link.onload = () => {
        overrideStyleElement = applyFontFamilyOverride();
      };
      if (isEnabled) {
        document.head.appendChild(link);
      }
    } catch (error) {
      console.error('Error applying PF5 styles:', error);
    }

    return () => {
      if (link) {
        try {
          link.remove();
        } catch (error) {
          // ensure UI does not crash if removal fails
          console.error('Error removing PF5 styles:', error);
        }
      }

      if (overrideStyleElement) {
        try {
          overrideStyleElement.remove();
        } catch (error) {
          console.error('Error removing PF6 font override styles:', error);
        }
      }
    };
  }, [isEnabled]);
}

export default usePf5Styles;

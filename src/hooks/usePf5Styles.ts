import { useFlag } from '@unleash/proxy-client-react';
import { useEffect } from 'react';

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
    };
  }, [isEnabled]);
}

export default usePf5Styles;

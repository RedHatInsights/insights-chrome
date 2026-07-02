import { useEffect } from 'react';

const FELT_THEME_CLASS = 'pf-v6-theme-felt';

/**
 * Adds the PatternFly "felt" theme class to the document root element
 * on mount, and removes it on unmount. Used by the Lightwell layout
 * to apply the felt visual treatment to all PF components.
 */
const useFeltTheme = () => {
  useEffect(() => {
    document.documentElement.classList.add(FELT_THEME_CLASS);
    return () => {
      document.documentElement.classList.remove(FELT_THEME_CLASS);
    };
  }, []);
};

export default useFeltTheme;

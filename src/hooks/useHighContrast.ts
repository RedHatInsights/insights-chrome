import { useEffect, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';

export enum HighContrastVariants {
  default,
  high,
  system,
}

export const useHighContrast = () => {
  const isHighContrastEnabled = useFlag('platform.chrome.high-contrast');

  const applyHighContrast = (isHigh: boolean) => {
    if (isHigh) {
      document.documentElement.classList.add('pf-v6-theme-high-contrast');
    } else {
      document.documentElement.classList.remove('pf-v6-theme-high-contrast');
    }
  };

  const getInitialMode = (): HighContrastVariants => {
    if (!isHighContrastEnabled) {
      applyHighContrast(false);
      return HighContrastVariants.default;
    }

    const saved = localStorage.getItem('chrome:high-contrast');

    if (saved === 'high') {
      applyHighContrast(true);
      return HighContrastVariants.high;
    } else if (saved === 'default') {
      applyHighContrast(false);
      return HighContrastVariants.default;
    } else if (saved === 'system') {
      const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
      applyHighContrast(prefersHighContrast);
      return HighContrastVariants.system;
    }

    // Default to system mode when no preference is saved
    localStorage.setItem('chrome:high-contrast', 'system');
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
    applyHighContrast(prefersHighContrast);
    return HighContrastVariants.system;
  };

  const [contrastMode, setContrastMode] = useState<HighContrastVariants>(getInitialMode);

  useEffect(() => {
    const newMode = getInitialMode();
    setContrastMode(newMode);
  }, [isHighContrastEnabled]);

  const setDefaultContrast = () => {
    setContrastMode(HighContrastVariants.default);
    applyHighContrast(false);
    localStorage.setItem('chrome:high-contrast', 'default');
  };

  const setHighContrast = () => {
    setContrastMode(HighContrastVariants.high);
    applyHighContrast(true);
    localStorage.setItem('chrome:high-contrast', 'high');
  };

  const setSystemContrast = () => {
    setContrastMode(HighContrastVariants.system);
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
    applyHighContrast(prefersHighContrast);
    localStorage.setItem('chrome:high-contrast', 'system');
  };

  return {
    contrastMode,
    setDefaultContrast,
    setHighContrast,
    setSystemContrast,
  };
};

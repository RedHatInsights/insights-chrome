import { useEffect, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';

export enum HighContrastVariants {
  default,
  high,
  system,
}

const applyHighContrast = (isHigh: boolean) => {
  if (isHigh) {
    document.documentElement.classList.add('pf-v6-theme-high-contrast');
  } else {
    document.documentElement.classList.remove('pf-v6-theme-high-contrast');
  }
};

const getInitialMode = (isHighContrastEnabled: boolean): HighContrastVariants => {
  if (!isHighContrastEnabled) {
    return HighContrastVariants.default;
  }

  const saved = localStorage.getItem('chrome:high-contrast');

  if (saved === 'high') return HighContrastVariants.high;
  if (saved === 'default') return HighContrastVariants.default;
  return HighContrastVariants.system;
};

const applyContrastMode = (mode: HighContrastVariants) => {
  if (mode === HighContrastVariants.high) {
    applyHighContrast(true);
  } else if (mode === HighContrastVariants.system) {
    localStorage.setItem('chrome:high-contrast', 'system');
    applyHighContrast(window.matchMedia('(prefers-contrast: more)').matches);
  } else {
    applyHighContrast(false);
  }
};

export const useHighContrast = () => {
  const isHighContrastEnabled = useFlag('platform.chrome.high-contrast');

  const [contrastMode, setContrastMode] = useState<HighContrastVariants>(() => getInitialMode(isHighContrastEnabled));

  useEffect(() => {
    const mode = getInitialMode(isHighContrastEnabled);
    setContrastMode(mode);
    applyContrastMode(mode);
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

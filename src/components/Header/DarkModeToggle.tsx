import { Switch } from '@patternfly/react-core';
import React, { useState } from 'react';

/* Toggle switch to change the theme between dark and light mode */
const DarkModeToggle = () => {
  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('pf-v6-theme-dark');
    } else {
      document.documentElement.classList.remove('pf-v6-theme-dark');
    }
    localStorage.setItem('chrome:theme', isDark ? 'dark' : 'light');
  };

  const [darkmode, setDarkmode] = useState(() => {
    const savedTheme = localStorage.getItem('chrome:theme');
    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      applyTheme(isDark);
      return isDark;
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
      return prefersDark;
    }
  });

  return (
    <Switch
      id="no-label-switch-on"
      isChecked={darkmode}
      aria-label="Dark mode switch"
      onChange={() => {
        const newDarkMode = !darkmode;
        setDarkmode(newDarkMode);
        applyTheme(newDarkMode);
      }}
    />
  );
};

export default DarkModeToggle;

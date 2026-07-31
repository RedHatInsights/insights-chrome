import React, { memo } from 'react';

interface LightwellLogoProps {
  theme?: 'light' | 'dark';
}

/**
 * Lightwell logo for the masthead.
 * Uses themed SVGs from frontend-assets — lightwell-light.svg for light theme,
 * lightwell-dark.svg for dark theme.
 */
const LightwellLogo = ({ theme = 'light' }: LightwellLogoProps) => {
  const src = theme === 'dark' ? '/apps/frontend-assets/partners-icons/lightwell-dark.svg' : '/apps/frontend-assets/partners-icons/lightwell-light.svg';
  return <img className="chr-c-brand" src={src} alt="Lightwell" height="30" />;
};

export default memo(LightwellLogo);

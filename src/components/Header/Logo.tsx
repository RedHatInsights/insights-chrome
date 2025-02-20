import React, { memo } from 'react';
import lightThemeLogo from '../../../static/images/logo.svg';
import darkThemeLogo from '../../../static/images/logo-dark.svg';
import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand';

interface LogoProps {
  theme?: 'light' | 'dark';
}

const Logo = ({ theme = 'light' }: LogoProps) => {
  const logoSrc = theme === 'light' ? lightThemeLogo : darkThemeLogo;

  return <Brand className="chr-c-brand" src={logoSrc} alt="Red Hat Logo" heights={{ default: '37px' }} />;
};

export default memo(Logo);

import React, { memo } from 'react';
import lightThemeLogo from '../../../static/images/logo.svg';
import darkThemeLogo from '../../../static/images/logo-dark.svg';
import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand';
import { layoutLightwellHeaderAtom } from '../../state/atoms/releaseAtom';
import { useAtomValue } from 'jotai';

interface LogoProps {
  theme?: 'light' | 'dark';
}

const LIGHTWELL_LOGO = '/apps/frontend-assets/partners-icons/lightwell-logomark.svg';

const Logo = ({ theme = 'light' }: LogoProps) => {
  const isLightwellHeader = useAtomValue(layoutLightwellHeaderAtom);

  const src = isLightwellHeader ? LIGHTWELL_LOGO : theme === 'light' ? lightThemeLogo : darkThemeLogo;
  const alt = isLightwellHeader ? 'Lightwell Logo' : 'Red Hat Logo';

  return <Brand className="chr-c-brand" src={src} alt={alt} heights={{ default: '37px' }} />;
};

export default memo(Logo);

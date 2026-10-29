import React, { memo } from 'react';
import lightThemeLogo from '../../../static/images/logo.svg';
import darkThemeLogo from '../../../static/images/logo-dark.svg';
import lightwellLightThemeLogo from '../../../static/images/lightwell-logo.svg';
import lightwellDarkThemeLogo from '../../../static/images/lightwell-logo-dark.svg';
import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand';
import { layoutLightwellHeaderAtom } from '../../state/atoms/releaseAtom';
import { useAtomValue } from 'jotai';
import { useDarkModeIsDark } from '../../chrome/darkModeStoreBridge';

const Logo = () => {
  const isLightwellHeader = useAtomValue(layoutLightwellHeaderAtom);
  const isDark = useDarkModeIsDark();

  const lightwellLogo = isDark ? lightwellDarkThemeLogo : lightwellLightThemeLogo;
  const rhLogo = isDark ? darkThemeLogo : lightThemeLogo;

  const src = isLightwellHeader ? lightwellLogo : rhLogo;
  const alt = isLightwellHeader ? 'Lightwell' : 'Red Hat Logo';

  return <Brand className="chr-c-brand" src={src} alt={alt} heights={{ default: '37px' }} />;
};

export default memo(Logo);

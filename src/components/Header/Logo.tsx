import React, { memo } from 'react';
import { lightwellLogoDark, lightwellLogoLight, rhLogoDark, rhLogoLight } from './logoAssets';
import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand';
import { layoutLightwellHeaderAtom } from '../../state/atoms/releaseAtom';
import { useAtomValue } from 'jotai';
import { useDarkModeIsDark } from '../../chrome/darkModeStoreBridge';

const Logo = () => {
  const isLightwellHeader = useAtomValue(layoutLightwellHeaderAtom);
  const isDark = useDarkModeIsDark();

  const lightwellLogo = isDark ? lightwellLogoDark : lightwellLogoLight;
  const rhLogo = isDark ? rhLogoDark : rhLogoLight;

  const src = isLightwellHeader ? lightwellLogo : rhLogo;
  const alt = isLightwellHeader ? 'Lightwell' : 'Red Hat Logo';

  return <Brand className="chr-c-brand" src={src} alt={alt} heights={{ default: '37px' }} />;
};

export default memo(Logo);

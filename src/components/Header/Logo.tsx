import React, { memo } from 'react';
import lightThemeLogo from '../../../static/images/logo.svg';
import darkThemeLogo from '../../../static/images/logo-dark.svg';
import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand';
import { layoutLightwellHeaderAtom } from '../../state/atoms/releaseAtom';
import { useAtomValue } from 'jotai';
import { useDarkModeStore } from '../../state/stores/darkModeStore';

const LIGHTWELL_LOGO_DARK = '/apps/frontend-assets/partners-icons/lightwell-logomark-dark.svg';
const LIGHTWELL_LOGO_LIGHT = '/apps/frontend-assets/partners-icons/lightwell-logomark-light.svg';

const Logo = () => {
  const isLightwellHeader = useAtomValue(layoutLightwellHeaderAtom);
  const { isDark } = useDarkModeStore();

  const lightwellLogo = isDark ? LIGHTWELL_LOGO_DARK : LIGHTWELL_LOGO_LIGHT;
  const rhLogo = isDark ? darkThemeLogo : lightThemeLogo;

  const src = isLightwellHeader ? lightwellLogo : rhLogo;
  const alt = isLightwellHeader ? 'Lightwell Logo' : 'Red Hat Logo';

  return <Brand className="chr-c-brand" src={src} alt={alt} heights={{ default: '37px' }} />;
};

export default memo(Logo);

import React from 'react';
import ChromeLink from '../ChromeLink';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { useDarkModeStore } from '../../state/stores/darkModeStore';

const LIGHTWELL_LOGO_DARK = '/apps/frontend-assets/partners-icons/lightwell-logomark-dark.svg';
const LIGHTWELL_LOGO_LIGHT = '/apps/frontend-assets/partners-icons/lightwell-logomark-light.svg';

const LightwellIcon = () => {
  const { isDark } = useDarkModeStore();
  const src = isDark ? LIGHTWELL_LOGO_DARK : LIGHTWELL_LOGO_LIGHT;
  return <img src={src} alt="" width="22" height="22" />;
};

const LightwellServicesLink = () => {
  return (
    <ChromeLink href="/lightwell" data-ouia-component-id="AllServices-Dropdown-Lightwell" className="chr-m-plain">
      <Split className="pf-v6-u-px-lg pf-v6-u-mb-0">
        <SplitItem>
          <LightwellIcon />
        </SplitItem>
        <SplitItem className="pf-v6-u-pt-xs pf-v6-u-pl-sm">Lightwell</SplitItem>
      </Split>
    </ChromeLink>
  );
};
export default LightwellServicesLink;

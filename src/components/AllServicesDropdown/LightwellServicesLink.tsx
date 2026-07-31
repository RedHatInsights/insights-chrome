import React from 'react';
import ChromeLink from '../ChromeLink';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';

/**
 * Lightwell icon using themed SVGs from frontend-assets.
 * Selects lightwell-dark.svg or lightwell-light.svg based on the current theme.
 */
const LightwellIcon = () => {
  const isDark = document.documentElement.classList.contains('pf-v6-theme-dark');
  const src = isDark ? '/apps/frontend-assets/partners-icons/lightwell-dark.svg' : '/apps/frontend-assets/partners-icons/lightwell-light.svg';
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

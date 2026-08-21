import React from 'react';
import ChromeLink from '../ChromeLink';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';

/**
 * Lightwell icon using the official logomark from frontend-assets.
 */
const LightwellIcon = () => <img src="/apps/frontend-assets/partners-icons/lightwell-logomark.svg" alt="" width="22" height="22" />;

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

import React from 'react';
import ChromeLink from '../ChromeLink';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';

import LightwellIcon from './icon-lightwell';

const LightwellServicesLink = () => {
  return (
    <Split className="pf-v6-u-px-lg pf-v6-u-mb-0">
      <SplitItem>
        <LightwellIcon />
      </SplitItem>
      <SplitItem className="pf-v6-u-pt-xs">
        <ChromeLink href="/lightwell" data-ouia-component-id="AllServices-Dropdown-Lightwell" className="pf-v6-u-pl-sm chr-m-plain">
          Lightwell
        </ChromeLink>
      </SplitItem>
    </Split>
  );
};
export default LightwellServicesLink;

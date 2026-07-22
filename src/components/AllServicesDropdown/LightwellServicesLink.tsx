import React from 'react';
import ChromeLink from '../ChromeLink';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';

import LightwellIcon from './icon-lightwell';

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

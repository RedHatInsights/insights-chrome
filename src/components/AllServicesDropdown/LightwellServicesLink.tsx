import React from 'react';
import ChromeLink from '../ChromeLink';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { ScalprumComponent, useScalprum } from '@scalprum/react-core';

const FRONTEND_ASSETS_SCOPE = 'frontend-assets';

/**
 * Renders the Lightwell icon from frontend-assets federated module.
 * Guards against the scope not being available in the Scalprum config
 * (e.g. not yet deployed to the environment) to prevent
 * "Cannot read properties of undefined (reading 'manifestLocation')" errors.
 */
const LightwellIcon = () => {
  const { config } = useScalprum();
  if (!config?.[FRONTEND_ASSETS_SCOPE]) {
    return null;
  }

  return (
    <ScalprumComponent
      scope={FRONTEND_ASSETS_SCOPE}
      module="./LightwellIcon"
      svgProps={{ width: '32', height: '32' }}
      ErrorComponent={<></>}
      fallback={<></>}
    />
  );
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

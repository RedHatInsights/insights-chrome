import React, { Fragment } from 'react';
import ChromeLink from '../ChromeLink';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';

import AnsibleIcon from '../AllServicesDropdown/icon-ansible';
import OpenShiftIcon from '../AllServicesDropdown/icon-openshift';
import RhelIcon from '../AllServicesDropdown/icon-rhel';
import LightWell from '../AllServicesDropdown/icon-lightwell';
import { useFlag } from '@unleash/proxy-client-react';

const PlatformServiceslinks = () => {
  const isITLess = useFlag('platform.chrome.itless');

  return (
    <>
      {isITLess ? null : (
        <Fragment>
          <Split className="pf-v6-u-px-lg pf-v6-u-mb-0">
            <SplitItem>
              <LightWell />
            </SplitItem>
            <SplitItem className="pf-v6-u-pt-xs">
              <ChromeLink href="/lightwell" data-ouia-component-id="AllServices-Dropdown-Lightwell" className="pf-v6-u-pl-sm chr-m-plain">
                Project Lightwell
              </ChromeLink>
            </SplitItem>
          </Split>
          <Split className="pf-v6-u-px-lg pf-v6-u-mb-0">
            <SplitItem>
              <AnsibleIcon />
            </SplitItem>
            <SplitItem className="pf-v6-u-pt-xs">
              <ChromeLink href="/ansible" data-ouia-component-id="AllServices-Dropdown-Ansible" className="pf-v6-u-pl-sm chr-m-plain">
                Red Hat Ansible Automation Platform
              </ChromeLink>
            </SplitItem>
          </Split>
        </Fragment>
      )}
      <Split className="pf-v6-u-pl-lg pf-v6-u-mb-0">
        <SplitItem>
          <RhelIcon />
        </SplitItem>
        <SplitItem className="pf-v6-u-pt-xs">
          <ChromeLink href="/insights" data-ouia-component-id="AllServices-Dropdown-RHEL" className="pf-v6-u-pl-sm chr-m-plain">
            Red Hat Enterprise Linux
          </ChromeLink>
        </SplitItem>
      </Split>
      <Split className="pf-v6-u-pl-lg pf-v6-u-mb-0">
        <SplitItem>
          <OpenShiftIcon />
        </SplitItem>
        <SplitItem className="pf-v6-u-pt-xs">
          <ChromeLink href="/openshift/overview" data-ouia-component-id="AllServices-Dropdown-Openshift" className="pf-v6-u-pl-sm pf-v6-u-pt-xs chr-m-plain">
            Red Hat OpenShift
          </ChromeLink>
        </SplitItem>
      </Split>
    </>
  );
};
export default PlatformServiceslinks;

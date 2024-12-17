import React from 'react';
import ChromeLink from '../ChromeLink';

const PlatformServiceslinks = () => {
  return (
    <>
      <ChromeLink href="/ansible" className="pf-v5-u-pl-lg pf-v5-u-pb-sm" data-ouia-component-id="AllServices-Dropdown-Ansible">
        Red Hat Ansible Automation Platform
      </ChromeLink>
      <ChromeLink href="/insights" className="pf-v5-u-pl-lg pf-v5-u-pb-sm" data-ouia-component-id="AllServices-Dropdown-RHEL">
        Red Hat Enterprise Linux
      </ChromeLink>
      <ChromeLink href="/openshift/overview" className="pf-v5-u-pl-lg pf-v5-u-pb-sm" data-ouia-component-id="AllServices-Dropdown-Openshift">
        Red Hat OpenShift
      </ChromeLink>
    </>
  );
};
export default PlatformServiceslinks;

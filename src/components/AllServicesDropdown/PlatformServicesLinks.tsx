import React from 'react';
import ChromeLink from '../ChromeLink';

const PlatformServiceslinks = () => {
  return (
    <>
      <ChromeLink href="/ansible" className="pf-v6-u-pl-lg pf-v6-u-pb-sm" data-ouia-component-id="AllServices-Dropdown-Ansible">
        Red Hat Ansible Automation Platform
      </ChromeLink>
      <ChromeLink href="/insights" className="pf-v6-u-pl-lg pf-v6-u-pb-sm" data-ouia-component-id="AllServices-Dropdown-RHEL">
        Red Hat Enterprise Linux
      </ChromeLink>
      <ChromeLink href="/openshift/overview" className="pf-v6-u-pl-lg pf-v6-u-pb-sm" data-ouia-component-id="AllServices-Dropdown-Openshift">
        Red Hat OpenShift
      </ChromeLink>
    </>
  );
};
export default PlatformServiceslinks;

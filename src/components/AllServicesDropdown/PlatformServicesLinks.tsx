import React from 'react';
import ChromeLink from '../ChromeLink';

const PlatformServiceslinks = () => {
  return (
    <>
      <ChromeLink href="/ansible" className="pf-v5-u-pl-lg pf-v5-u-pb-sm">
        Red Hat Ansible Platform
      </ChromeLink>
      <ChromeLink href="/insights" className="pf-v5-u-pl-lg pf-v5-u-pb-sm">
        Red Hat Enterprise Linux
      </ChromeLink>
      <ChromeLink href="/openshift/overview" className="pf-v5-u-pl-lg pf-v5-u-pb-sm">
        Red Hat OpenShift
      </ChromeLink>
    </>
  );
};
export default PlatformServiceslinks;

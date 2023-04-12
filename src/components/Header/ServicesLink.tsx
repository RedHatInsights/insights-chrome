import React from 'react';
import { Button } from '@patternfly/react-core';

import ChromeLink from '../ChromeLink';

const ServicesLink = () => {
  return (
    <Button
      className="chr-c-button-masthead pf-u-px-lg-on-md"
      component={(props) => <ChromeLink {...props} href="/allservices" documentTitleUpdate="All Services" />}
    >
      Services
    </Button>
  );
};

export default ServicesLink;

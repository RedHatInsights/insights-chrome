import React from 'react';
import { Button } from '@patternfly/react-core';
import CloudIcon from '@patternfly/react-icons/dist/js/icons/cloud-icon';

import ChromeLink from '../ChromeLink';

const ServicesLink = () => {
  return (
    <Button className="chr-c-button-masthead" component={(props) => <ChromeLink {...props} href="/AllServices" />}>
      <CloudIcon />
      Services
    </Button>
  );
};

export default ServicesLink;

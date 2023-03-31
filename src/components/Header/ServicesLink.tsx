import React from 'react';
import { Button, Icon } from '@patternfly/react-core';
import CloudIcon from '@patternfly/react-icons/dist/js/icons/cloud-icon';

import ChromeLink from '../ChromeLink';

const ServicesLink = () => {
  return (
    <Button
      className="chr-c-button-masthead pf-u-px-lg-on-md"
      component={(props) => <ChromeLink {...props} href="/allservices" documentTitleUpdate="All Services" />}
    >
      <Icon isInline className="ins-m-hide-on-sm">
        <CloudIcon />
      </Icon>
      Services
    </Button>
  );
};

export default ServicesLink;

import React from 'react';
import { Button } from '@patternfly/react-core';

import ChromeLink from '../ChromeLink';

const SatelliteLink = () => {
  return (
    <Button className="chr-c-button-masthead pf-u-px-lg-on-md" component={(props) => <ChromeLink {...props} href="/insights/satellite" />}>
      Manage Satellites
    </Button>
  );
};

export default SatelliteLink;

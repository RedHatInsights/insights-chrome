import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';

import ChromeLink from '../ChromeLink';

const SatelliteLink = () => {
  return (
    <Button className="chr-c-button-masthead pf-v6-u-px-lg-on-md" component={(props) => <ChromeLink {...props} href="/insights/satellite" />}>
      Manage Satellites
    </Button>
  );
};

export default SatelliteLink;

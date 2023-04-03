import React from 'react';
import { StackItem } from '@patternfly/react-core';

import ChromeLink from '../ChromeLink/ChromeLink';

const QuickAccess = () => (
  <StackItem className="pf-u-pb-xl">
    Get quick access to your favorite services. To add more services to your Favorites,{' '}
    <ChromeLink href="/allservices">browse all Hybrid Cloud Console services.</ChromeLink>
  </StackItem>
);

export default QuickAccess;

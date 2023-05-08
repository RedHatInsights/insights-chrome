import React from 'react';
import { Button } from '@patternfly/react-core';

import ChromeLink from '../ChromeLink';

const FavoritesLink = () => {
  return (
    <Button className="chr-c-button-masthead pf-u-px-lg-on-md" component={(props) => <ChromeLink {...props} href="/favoritedservices" />}>
      Favorites
    </Button>
  );
};

export default FavoritesLink;

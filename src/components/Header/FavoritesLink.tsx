import React from 'react';
import { Button } from '@patternfly/react-core';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';

import ChromeLink from '../ChromeLink';

const FavoritesLink = () => {
  return (
    <Button className="chr-c-button-masthead" component={(props) => <ChromeLink {...props} href="/FavoritedServices" />}>
      <StarIcon />
      Favorites
    </Button>
  );
};

export default FavoritesLink;

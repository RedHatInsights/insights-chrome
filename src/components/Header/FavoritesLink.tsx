import React from 'react';
import { Button, Icon } from '@patternfly/react-core';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';

import ChromeLink from '../ChromeLink';

const FavoritesLink = () => {
  return (
    <Button
      className="chr-c-button-masthead pf-u-px-lg-on-md"
      component={(props) => <ChromeLink {...props} href="/favoritedservices" documentTitleUpdate="Favorited Services" />}
    >
      <Icon isInline className="ins-m-hide-on-sm">
        <StarIcon />
      </Icon>
      Favorites
    </Button>
  );
};

export default FavoritesLink;

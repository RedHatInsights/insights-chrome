import { useContext } from 'react';
import { MenuItem, MenuItemAction } from '@patternfly/react-core/dist/dynamic/components/Menu';

import ChromeLink from '../ChromeLink';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';
import { AllServicesDropdownContext } from './common';
import { titleToId } from '../../utils/common';
import type { AllServicesLink as AllServicesLinkType } from '../AllServices/allServicesLinks';

type AllServicesGalleryLinkProps = AllServicesLinkType & { category: string; group?: string };

const AllServicesGalleryLink = ({ href, title, description, isExternal, category, group }: AllServicesGalleryLinkProps) => {
  const { favoritePage, unfavoritePage, favoritePages } = useFavoritePagesWrapper();
  const { onLinkClick } = useContext(AllServicesDropdownContext);

  const handleFavoriteToggle = (pathname: string, favorite?: boolean) => {
    if (favorite) {
      unfavoritePage(pathname);
    } else {
      favoritePage(pathname);
    }
  };

  const isFavorite = !!favoritePages.find(({ pathname, favorite }) => pathname === href && favorite);

  return (
    <MenuItem
      isExternalLink={isExternal}
      description={description}
      component={(props) => <ChromeLink {...props} href={href} isExternal={isExternal} onClickCapture={onLinkClick} />}
      data-ouia-component-id={`${category}-${group ? `${group}-` : ''}${titleToId(title)}-Link`}
      actions={
        !isExternal ? (
          <MenuItemAction
            className="pf-v6-u-align-self-center"
            isFavorited={isFavorite}
            icon="favorites"
            actionId={`${titleToId(title)}-favorite`}
            aria-label={`${isFavorite ? 'Unfavorite' : 'Favorite'} ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleFavoriteToggle(href, isFavorite);
            }}
            data-ouia-component-id={`${category}-${group ? `${group}-` : ''}${titleToId(title)}-FavoriteToggle`}
          />
        ) : undefined
      }
    >
      {title}
    </MenuItem>
  );
};

export default AllServicesGalleryLink;

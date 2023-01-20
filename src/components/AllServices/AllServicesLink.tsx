import React from 'react';
import { Button, Text, TextVariants } from '@patternfly/react-core';
import classNames from 'classnames';
import useFavoritePages from '@redhat-cloud-services/chrome/useFavoritePages';
import { matchPath } from 'react-router-dom';

import StarHalfAltIcon from '@patternfly/react-icons/dist/js/icons/star-half-alt-icon';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';

import ChromeLink from '../ChromeLink';
import type { AllServicesLink as AllServicesLinkType } from './allServicesLinks';
import { shallowEqual, useSelector } from 'react-redux';
import { ReduxState } from '../../redux/store';

export type AllServicesLinkProps = AllServicesLinkType;

const AllServicesLink = ({ href, title, isExternal }: AllServicesLinkProps) => {
  // Find service appId
  const appId = useSelector(
    ({ chrome: { moduleRoutes } }: ReduxState) => moduleRoutes.find(({ path }) => matchPath(path, href) || matchPath(`${path}/*`, href))?.scope,
    shallowEqual
  );
  const { favoritePage, unfavoritePage, favoritePages } = useFavoritePages();

  const handleFavouriteToggle = (pathname: string, favorite?: boolean) => {
    if (favorite) {
      unfavoritePage(pathname);
    } else {
      favoritePage(pathname);
    }
  };

  const isFavorite = !!favoritePages.find(({ pathname, favorite }) => pathname === href && favorite);
  return (
    <Text className="chr-c-allservices__link-wrapper" component={TextVariants.p}>
      <ChromeLink appId={appId} isExternal={isExternal} href={href}>
        {title}
        {isExternal && <ExternalLinkAltIcon />}
      </ChromeLink>
      {!isExternal && (
        <span>
          <Button
            onClick={() => handleFavouriteToggle(href, isFavorite)}
            variant="plain"
            aria-label={`${isFavorite ? 'Unfavorite' : 'Favorite'} ${title}`}
            className={classNames('pf-u-ml-sm', 'pf-u-p-0', 'chr-c-allservices__favourite', {
              'chr-c-allservices__favourite_not': !isFavorite,
            })}
          >
            {isFavorite ? <StarIcon color="var(--pf-global--palette--gold-200)" /> : <StarHalfAltIcon color="var(--pf-global--palette--gold-200)" />}
          </Button>
        </span>
      )}
    </Text>
  );
};

export default AllServicesLink;

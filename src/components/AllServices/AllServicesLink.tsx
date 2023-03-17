import React from 'react';
import { Icon, Text, TextVariants } from '@patternfly/react-core';
import classNames from 'classnames';
import useFavoritePages from '@redhat-cloud-services/chrome/useFavoritePages';
import { matchPath } from 'react-router-dom';

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
    <Text
      component={TextVariants.p}
      className={classNames('chr-c-favorite-trigger', {
        'chr-c-icon-favorited': isFavorite,
      })}
    >
      <ChromeLink appId={appId} isExternal={isExternal} href={href}>
        {title}
        {isExternal && (
          <Icon className="pf-u-ml-sm chr-c-icon-external-link" isInline>
            <ExternalLinkAltIcon />
          </Icon>
        )}
      </ChromeLink>
      {!isExternal && (
        <Icon
          onClick={() => handleFavouriteToggle(href, isFavorite)}
          aria-label={`${isFavorite ? 'Unfavorite' : 'Favorite'} ${title}`}
          className="pf-u-ml-sm chr-c-icon-star"
          isInline
        >
          <StarIcon />
        </Icon>
      )}
    </Text>
  );
};

export default AllServicesLink;

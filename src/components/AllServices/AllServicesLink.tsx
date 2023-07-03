import React from 'react';
import { Text, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';

import classNames from 'classnames';
import { matchPath } from 'react-router-dom';

import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';

import ChromeLink from '../ChromeLink';
import type { AllServicesLink as AllServicesLinkType } from './allServicesLinks';
import { shallowEqual, useSelector } from 'react-redux';
import { ReduxState } from '../../redux/store';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';

export type AllServicesLinkProps = AllServicesLinkType;

const AllServicesLink = ({ href, title, isExternal }: AllServicesLinkProps) => {
  // Find service appId
  const appId = useSelector(
    ({ chrome: { moduleRoutes } }: ReduxState) => moduleRoutes.find(({ path }) => matchPath(path, href) || matchPath(`${path}/*`, href))?.scope,
    shallowEqual
  );
  const { favoritePage, unfavoritePage, favoritePages } = useFavoritePagesWrapper();

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
          <Icon className="pf-v5-u-ml-sm chr-c-icon-external-link" isInline>
            <ExternalLinkAltIcon />
          </Icon>
        )}
      </ChromeLink>
      {!isExternal && (
        <Icon
          onClick={() => handleFavouriteToggle(href, isFavorite)}
          aria-label={`${isFavorite ? 'Unfavorite' : 'Favorite'} ${title}`}
          className="pf-v5-u-ml-sm chr-c-icon-star"
          isInline
        >
          <StarIcon />
        </Icon>
      )}
    </Text>
  );
};

export default AllServicesLink;

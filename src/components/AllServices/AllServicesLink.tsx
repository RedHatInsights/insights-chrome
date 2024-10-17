import React, { useMemo } from 'react';
import { Text, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';

import classNames from 'classnames';
import { matchPath } from 'react-router-dom';

import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';

import ChromeLink from '../ChromeLink';
import type { AllServicesLink as AllServicesLinkType } from './allServicesLinks';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';
import { useAtomValue } from 'jotai';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';
import { titleToId } from '../../utils/common';

export type AllServicesLinkProps = AllServicesLinkType & { category: string; group?: string };

const AllServicesLink = ({ href, title, isExternal, category, group }: AllServicesLinkProps) => {
  const moduleRoutes = useAtomValue(moduleRoutesAtom);
  // Find service appId
  const appId = useMemo(() => {
    return moduleRoutes.find(({ path }) => matchPath(path, href) || matchPath(`${path}/*`, href))?.scope;
  }, [moduleRoutes, href]);
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
      <ChromeLink
        appId={appId}
        isExternal={isExternal}
        href={href}
        data-ouia-component-id={`${category}-${group ? `${group}-` : ''}${titleToId(title)}-Link`}
      >
        {title}
        {isExternal && (
          <Icon className="pf-v6-u-ml-sm chr-c-icon-external-link" isInline>
            <ExternalLinkAltIcon />
          </Icon>
        )}
      </ChromeLink>
      {!isExternal && (
        <Icon
          data-ouia-component-id={`${category}-${group ? `${group}-` : ''}${titleToId(title)}-FavoriteToggle`}
          onClick={() => handleFavouriteToggle(href, isFavorite)}
          aria-label={`${isFavorite ? 'Unfavorite' : 'Favorite'} ${title}`}
          className="pf-v6-u-ml-sm chr-c-icon-star"
          isInline
        >
          <StarIcon />
        </Icon>
      )}
    </Text>
  );
};

export default AllServicesLink;

import React, { useMemo } from 'react';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';

import classNames from 'classnames';
import { matchPath } from 'react-router-dom';

import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';

import ChromeLink from '../ChromeLink';
import { useAtomValue } from 'jotai';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';
import { useFlag } from '@unleash/proxy-client-react';
import { titleToId } from '../../utils/common';

interface AllServicesLinkProps {
  href?: string;
  title?: string;
  sectionTitle?: string;
  bundleTitle?: string;
  isExternal?: boolean;
  category?: string;
  group?: string;
}

const AllServicesLink = ({ href, title, sectionTitle, bundleTitle, isExternal = false, category, group }: AllServicesLinkProps) => {
  const enableAllServicesRedesign = useFlag('platform.chrome.allservices.redesign');

  const moduleRoutes = useAtomValue(moduleRoutesAtom);
  // Find service appId
  const appId = useMemo(() => {
    return moduleRoutes.find(({ path }) => matchPath(path, href ? href : '') || matchPath(`${path}/*`, href ? href : ''))?.scope;
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

  return enableAllServicesRedesign ? (
    <Flex className="pf-v6-u-mb-md" gap={{ default: 'gapXs' }}>
      <FlexItem>
        <ChromeLink className="chr-c-favorite-service__tile" appId={appId} isExternal={isExternal} href={href ?? '#'} data-ouia-component-id={`${title}`}>
          {title}
          {isExternal && (
            <Icon className="pf-v6-u-ml-sm chr-c-icon-external-link" isInline>
              <ExternalLinkAltIcon />
            </Icon>
          )}
        </ChromeLink>
      </FlexItem>
      <FlexItem>
        <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-disabled">
          {sectionTitle} {sectionTitle && bundleTitle ? `>` : ''}{' '}
        </div>
      </FlexItem>
      <FlexItem>
        <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-disabled">{bundleTitle}</div>
      </FlexItem>
      <FlexItem
        className={classNames('chr-c-favorite-trigger', {
          'chr-c-icon-favorited': isFavorite,
        })}
      >
        {!isExternal && (
          <Icon
            data-ouia-component-id={`${category}-${group ? `${group}-` : ''}${titleToId(title ?? '')}-FavoriteToggle`}
            onClick={() => handleFavouriteToggle(href ?? '#', isFavorite)}
            aria-label={`${isFavorite ? 'Unfavorite' : 'Favorite'} ${title}`}
            className="pf-v6-u-ml-xs"
            isInline
          >
            <StarIcon />
          </Icon>
        )}
      </FlexItem>
    </Flex>
  ) : (
    <Content
      component={ContentVariants.p}
      className={classNames('chr-c-favorite-trigger', {
        'chr-c-icon-favorited': isFavorite,
      })}
    >
      <ChromeLink
        appId={appId}
        isExternal={isExternal}
        href={href ?? '#'}
        data-ouia-component-id={`${category}-${group ? `${group}-` : ''}${titleToId(title ?? '')}-Link`}
      >
        {title}
        {isExternal && (
          <Icon className="chr-c-icon-external-link" size="sm" isInline>
            <ExternalLinkAltIcon />
          </Icon>
        )}
      </ChromeLink>
      {!isExternal && (
        <Icon
          data-ouia-component-id={`${category}-${group ? `${group}-` : ''}${titleToId(title ?? '')}-FavoriteToggle`}
          onClick={() => handleFavouriteToggle(href ?? '#', isFavorite)}
          aria-label={`${isFavorite ? 'Unfavorite' : 'Favorite'} ${title}`}
          isInline
        >
          <StarIcon />
        </Icon>
      )}
    </Content>
  );
};

export default AllServicesLink;

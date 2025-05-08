import React, { useContext } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';

import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import ChromeLink from '../ChromeLink';
import classNames from 'classnames';
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
    <ChromeLink
      isExternal={isExternal}
      href={href}
      className="chr-c-favorite-service__tile"
      data-ouia-component-id={`${category}-${group ? `${group}-` : ''}${titleToId(title)}-Link`}
    >
      <Split
        className={classNames('chr-c-link-service-card pf-v6-u-px-lg chr-c-favorite-trigger', {
          'chr-c-icon-favorited': isFavorite,
        })}
        onClick={onLinkClick}
      >
        <SplitItem className="pf-v6-u-pt-sm" isFilled>
          {title}
        </SplitItem>
        <SplitItem className="pf-v6-u-mt-sm">
          {isExternal ? (
            <Icon className="pf-v6-u-mr-sm chr-c-icon-external-link pf-v6-u-text-color-link" isInline>
              <ExternalLinkAltIcon />
            </Icon>
          ) : (
            <Button
              variant="plain"
              className="pf-v6-u-p-0"
              ouiaId={`${category}-${group ? `${group}-` : ''}${titleToId(title)}-FavoriteToggle`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleFavoriteToggle(href, isFavorite);
              }}
              icon={
                <Icon
                  className={classNames('pf-v6-u-ml-0', {
                    favorite: isFavorite,
                  })}
                >
                  <StarIcon />
                </Icon>
              }
            />
          )}
        </SplitItem>
      </Split>
      <Split className="pf-v6-u-px-lg">
        <SplitItem isFilled>
          <Content>
            <Content component="p" className="pf-v6-u-pt-0 pf-v6-u-pb-sm pf-v6-u-font-size-xs pf-v6-u-color-100">
              {description ?? ''}
            </Content>
          </Content>
        </SplitItem>
      </Split>
    </ChromeLink>
  );
};

export default AllServicesGalleryLink;

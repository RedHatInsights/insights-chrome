import React, { useContext } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card, CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';

import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';

import { AllServicesLinkProps } from '../AllServices/AllServicesLink';
import ChromeLink from '../ChromeLink';
import classNames from 'classnames';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';
import { AllServicesDropdownContext } from './common';
import ServiceIcon from '../FavoriteServices/ServiceIcon';
import { titleToId } from '../../utils/common';

export type AllServicesGalleryLinkProps = AllServicesLinkProps;

const AllServicesGalleryLink = ({ href, title, icon, description, isExternal, category, group }: AllServicesGalleryLinkProps) => {
  const { favoritePage, unfavoritePage, favoritePages } = useFavoritePagesWrapper();
  const { onLinkClick } = useContext(AllServicesDropdownContext);
  const TitleIcon = icon ? <ServiceIcon icon={icon} /> : null;

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
      <Card
        className={classNames('chr-c-link-service-card chr-c-favorite-trigger', {
          'chr-c-icon-favorited': isFavorite,
        })}
        isFullHeight
        isFlat
        isSelectableRaised
        onClick={onLinkClick}
      >
        <CardBody className="pf-v6-u-p-md">
          <Split>
            <SplitItem className="pf-v6-u-mr-sm">{TitleIcon}</SplitItem>
            <SplitItem className="pf-v5-m-fill">
              <div className="pf-v6-u-mb-sm">{title}</div>
            </SplitItem>
            <SplitItem>
              {isExternal ? (
                <Icon className="pf-v6-u-ml-sm chr-c-icon-external-link" isInline>
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
                      className={classNames('pf-v6-u-ml-sm chr-c-icon-star', {
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
          <TextContent>
            <Text className="pf-v6-u-font-size-xs pf-v6-u-color-100">{description ?? ''}</Text>
          </TextContent>
        </CardBody>
      </Card>
    </ChromeLink>
  );
};

export default AllServicesGalleryLink;

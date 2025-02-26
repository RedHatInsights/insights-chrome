import React, { useContext } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card, CardBody, CardTitle } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';

import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import ChromeLink from '../ChromeLink';
import classNames from 'classnames';
import useFavoritePagesWrapper from '../../hooks/useFavoritePagesWrapper';
import { AllServicesDropdownContext } from './common';
import ServiceIcon from '../FavoriteServices/ServiceIcon';
import { titleToId } from '../../utils/common';
import type { AllServicesLink as AllServicesLinkType } from '../AllServices/allServicesLinks';

type AllServicesGalleryLinkProps = AllServicesLinkType & { category: string; group?: string };

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
        onClick={onLinkClick}
      >
        <CardTitle>
          <Split>
            <SplitItem className="pf-v6-u-mr-sm">{TitleIcon}</SplitItem>
            <SplitItem isFilled>
              <div className="pf-v6-u-mb-sm pf-v6-u-text-color-link">{title}</div>
            </SplitItem>
            <SplitItem>
              {isExternal ? (
                <Icon className="pf-v6-u-ml-sm chr-c-icon-external-link pf-v6-u-text-color-link" isInline>
                  <ExternalLinkAltIcon />
                </Icon>
              ) : (
                <Button
                  variant="plain"
                  className="chr-c-favorite-button"
                  ouiaId={`${category}-${group ? `${group}-` : ''}${titleToId(title)}-FavoriteToggle`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleFavoriteToggle(href, isFavorite);
                  }}
                  icon={
                    <Icon
                      className={classNames('chr-c-icon-star', {
                        favorite: isFavorite,
                      })}
                      size="lg"
                    >
                      <StarIcon />
                    </Icon>
                  }
                  style={{ marginTop: '-8px', marginRight: '-8px' }}
                />
              )}
              {/* custom styling above aligns the favorite icon better with the title text */}
            </SplitItem>
          </Split>
        </CardTitle>

        <CardBody>
          <Content>
            <Content component="p" className="pf-v6-u-font-size-xs pf-v6-u-color-100">
              {description ?? ''}
            </Content>
          </Content>
        </CardBody>
      </Card>
    </ChromeLink>
  );
};

export default AllServicesGalleryLink;

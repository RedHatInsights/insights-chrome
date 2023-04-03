import React from 'react';
import { Button, Card, CardBody, Icon, Split, SplitItem, Text, TextContent } from '@patternfly/react-core';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { useFavoritePages } from '@redhat-cloud-services/chrome';

import { AllServicesLinkProps } from '../AllServices/AllServicesLink';
import ChromeLink from '../ChromeLink';
import { bundleMapping } from '../../hooks/useBundle';
import classNames from 'classnames';

export type AllServicesGalleryLinkProps = AllServicesLinkProps;

const AllServicesGalleryLink = ({ href, title, description, isExternal }: AllServicesGalleryLinkProps) => {
  const getBundle = (href: string) => bundleMapping[href.split('/')[1]];
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
    <ChromeLink isExternal={isExternal} href={href} className="chr-c-favorite-service__tile">
      <Card className="chr-c-link-service-card" isFullHeight isFlat isSelectableRaised>
        <CardBody className="pf-u-p-md">
          <Split
            className={classNames('chr-c-favorite-trigger', {
              'chr-c-icon-favorited': isFavorite,
            })}
          >
            <SplitItem className="pf-m-fill">{title}</SplitItem>
            <SplitItem>
              {isExternal ? (
                <Icon className="pf-u-ml-sm chr-c-icon-external-link" isInline>
                  <ExternalLinkAltIcon />
                </Icon>
              ) : (
                <Button
                  variant="plain"
                  className="pf-u-p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleFavouriteToggle(href, isFavorite);
                  }}
                  icon={
                    <Icon
                      className={classNames('pf-u-ml-sm chr-c-icon-star', {
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
            <Text component="small">{getBundle(href)}</Text>
            <Text component="small" className="pf-u-color-100">
              {description ?? ''}
            </Text>
          </TextContent>
        </CardBody>
      </Card>
    </ChromeLink>
  );
};

export default AllServicesGalleryLink;

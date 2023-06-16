import { Card, CardBody, Flex, FlexItem, Gallery, GalleryItem, Icon, Pagination, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import React, { useState } from 'react';
import useFavoritedServices from '../../hooks/useFavoritedServices';
import EmptyState from '../FavoriteServices/EmptyState';
import { bundleMapping } from '../../hooks/useBundle';
import './LandingNavFavorites.scss';
import ChromeLink from '../ChromeLink';

const LandingNavFavorites = () => {
  const favoritedServices = useFavoritedServices();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = React.useState(4);

  const onSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const onPerPageSelect = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number, newPage: number) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const getBundle = (href: string) => bundleMapping[href.split('/')[1]];

  const buildFavorites = () => {
    return favoritedServices.slice((page - 1) * perPage, page * perPage).map((favorite, index) => (
      <GalleryItem key={index}>
        <ChromeLink href={favorite.pathname} className="chr-c-favorite-service__tile">
          <Card isFullHeight isFlat isSelectableRaised>
            <CardBody className="pf-v5-u-p-lg pf-v5-u-pt-xl">
              <TextContent className="pf-v5-u-text-align-center">
                <Text component="p" className="pf-v5-u-mb-sm">
                  {favorite.name}
                </Text>
                <Text component="p" className="pf-v5-u-font-size-xs">
                  {getBundle(favorite.pathname)}
                </Text>
              </TextContent>
            </CardBody>
          </Card>
        </ChromeLink>
      </GalleryItem>
    ));
  };

  return (
    <React.Fragment>
      <Flex>
        <FlexItem>
          <TextContent>
            <Text component={TextVariants.h2} className="pf-v5-u-display-inline pf-v5-u-pr-lg">
              <Icon className="pf-v5-u-mr-sm" status="warning">
                <StarIcon />
              </Icon>
              My favorite services
            </Text>
            <Text component={TextVariants.p} className="pf-v5-u-display-inline">
              <ChromeLink href="/allservices">View all services</ChromeLink>
            </Text>
          </TextContent>
        </FlexItem>
        <FlexItem align={{ default: 'alignRight' }}>
          <Pagination
            isCompact
            variant="top"
            itemCount={favoritedServices.length}
            page={page}
            perPage={perPage}
            onPerPageSelect={onPerPageSelect}
            onSetPage={onSetPage}
            widgetId="favorites-cards-pagination"
            className="chr-c-pagination-landing-favorites"
          />
        </FlexItem>
      </Flex>

      {favoritedServices.length === 0 ? (
        <EmptyState />
      ) : (
        <React.Fragment>
          <Gallery hasGutter>{buildFavorites()}</Gallery>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default LandingNavFavorites;

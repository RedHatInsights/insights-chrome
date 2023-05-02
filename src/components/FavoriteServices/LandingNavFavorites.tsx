import { Card, CardBody, Gallery, GalleryItem, Icon, Pagination, Title, Text, TextContent } from '@patternfly/react-core';
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
            <CardBody className="pf-u-p-md">
              {favorite.name}
              <TextContent>
                <Text component="small">{getBundle(favorite.pathname)}</Text>
              </TextContent>
            </CardBody>
          </Card>
        </ChromeLink>
      </GalleryItem>
    ));
  };

  return (
    <React.Fragment>
      <Title headingLevel="h2">
        <Icon className="chr-c-icon-favorites pf-u-ml-md" status="warning">
          <StarIcon />
        </Icon>
        My favorite services
        <ChromeLink href="/allservices" className="landing-all-services-link">
          View all services
        </ChromeLink>
      </Title>

      {favoritedServices.length === 0 ? (
        <EmptyState />
      ) : (
        <React.Fragment>
          <Pagination
            perPageComponent="button"
            isCompact
            variant="top"
            itemCount={favoritedServices.length}
            page={page}
            perPage={perPage}
            onPerPageSelect={onPerPageSelect}
            onSetPage={onSetPage}
            widgetId="favorites-cards-pagination"
          ></Pagination>
          <Gallery hasGutter className="hr-c-tile-landing">
            {buildFavorites()}
          </Gallery>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default LandingNavFavorites;
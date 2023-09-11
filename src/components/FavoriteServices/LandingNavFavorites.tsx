import { Card, CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Gallery, GalleryItem } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { Text, TextContent, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { StarIcon } from '@patternfly/react-icons/dist/dynamic/icons/star-icon';
import React, { useState } from 'react';
import useFavoritedServices from '../../hooks/useFavoritedServices';
import EmptyState from '../FavoriteServices/EmptyState';
import { bundleMapping } from '../../hooks/useBundle';
import './LandingNavFavorites.scss';
import { Link } from 'react-router-dom';

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
        <Link to={favorite.pathname} className="chr-c-favorite-service__tile">
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
        </Link>
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
              <Link to="/allservices">View all services</Link>
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

import { Icon, Card, CardBody, Tile, Title, Pagination, PaginationProps, PaginationVariant, Gallery, GalleryItem, Text, TextContent } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import React, { useEffect, Fragment, ReactNode, useState } from 'react';
import useFavoritedServices from '../../hooks/useFavoritedServices';
import EmptyState from '../FavoriteServices/EmptyState';
import ServiceTile, { ServiceTileProps } from './ServiceTile';
import { useNavigate } from "react-router-dom";
import { bundleMapping } from '../../hooks/useBundle';
import './LandingNavFavorites.scss';
import ChromeLink from '../ChromeLink';

const LandingNavFavorites = () => {

  const favoritedServices  = useFavoritedServices();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = React.useState(20);

  const onSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const favoriteName = (name?: ReactNode): string => {
    if (name) {
      return name.toString();
    } else {
      return ""
    }
  }

  const getBundle = (href: string) => bundleMapping[href.split('/')[1]];

  return (
    <React.Fragment>
      <Title 
        headingLevel='h2'>
        <Icon className="chr-c-icon-service-tab pf-u-ml-md" status="warning">
          <StarIcon />
        </Icon> 
        My favorite services
      </Title>
      {favoritedServices.length === 0 ? (
        <EmptyState />
      ) : (
        <Pagination
          isCompact
          variant="top">
          <Gallery hasGutter className="hr-c-tile-landing">
            {favoritedServices.map((favorite, index) => (
              <GalleryItem>
                {/* <Tile isDisplayLarge={true} title={favoriteName(favorite.name)} isSelected={false} onClick={() => routeChange(favorite.pathname)}>
                  {getBundle(favorite.pathname)}
                </Tile> */}
                <ChromeLink href={favorite.pathname} className="chr-c-favorite-service__tile">
                  <Card isFullHeight isFlat isSelectableRaised>
                    <CardBody className="pf-u-p-md">
                      {favoriteName(favorite.name)}
                      <TextContent>
                        <Text component="small">{getBundle(favorite.pathname)}</Text>
                      </TextContent>
                    </CardBody>
                  </Card>
                </ChromeLink>
              </GalleryItem>
            ))}  
          </Gallery>
        </Pagination>       
      )}
    </React.Fragment>
  )
}

export default LandingNavFavorites;
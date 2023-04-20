import { Icon, Tile, Title, Pagination, PaginationProps, PaginationVariant } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import React, { useEffect, Fragment, ReactNode } from 'react';
import useFavoritedServices from '../../hooks/useFavoritedServices';
import EmptyState from '../FavoriteServices/EmptyState';
import ServiceTile, { ServiceTileProps } from './ServiceTile';
import { useNavigate } from "react-router-dom";
import { bundleMapping } from '../../hooks/useBundle';
import './LandingNavFavorites.scss';

const LandingNavFavorites = () => {

  const favoritedServices  = useFavoritedServices();

  const favoriteName = (name?: ReactNode): string => {
    if (name) {
      return name.toString();
    } else {
      return ""
    }
  }

  let navigate = useNavigate();
  const routeChange = (pathname: string) => {
    navigate(pathname)
  }

  const getBundle = (href: string) => bundleMapping[href.split('/')[1]];

  return (
    <React.Fragment>
      <Title 
        headingLevel='h2'>
        <Icon className="pf-u-ml-md" status="warning">
          <StarIcon size="sm" className="chr-c-icon-service-tab" />
        </Icon> 
        My favorite services
      </Title>
      {favoritedServices.length === 0 ? (
        <EmptyState />
      ) : (
        <div role="listbox" aria-label="Tiles with subtext">
          {favoritedServices.map((favorite, index) => (
            <Tile title={favoriteName(favorite.name)} isSelected={false} onClick={() => routeChange(favorite.pathname)}>
              {getBundle(favorite.pathname)}
            </Tile>
              

          ))}         
      </div>
      )}
  </React.Fragment>
  )
}

export default LandingNavFavorites;
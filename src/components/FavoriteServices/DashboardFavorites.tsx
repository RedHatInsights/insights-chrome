import { Gallery, GalleryItem } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import React from 'react';

import useFavoritedServices from '../../hooks/useFavoritedServices';
import EmptyState from '../FavoriteServices/EmptyState';
import { bundleMapping } from '../../hooks/useBundle';
import { Link } from 'react-router-dom';

import ServiceIcon from './ServiceIcon';

import './DashboardFavorites.scss';

const DashboardFavorites = () => {
  const favoritedServices = useFavoritedServices();
  const getBundle = (href: string) => bundleMapping[href.split('/')[1]];

  return (
    <React.Fragment>
      {favoritedServices.length === 0 ? (
        <EmptyState />
      ) : (
        <React.Fragment>
          <Gallery hasGutter className="widget-favorites pf-v6-u-m-md">
            {favoritedServices.map((favorite, index) => (
              <GalleryItem key={index}>
                <Split>
                  <SplitItem className="pf-v6-u-mr-sm">
                    <ServiceIcon icon={favorite.icon} />
                  </SplitItem>
                  <SplitItem>
                    <TextContent>
                      <Link to={favorite.pathname}>
                        <Text className="pf-v6-u-mb-0">{favorite.name}</Text>
                      </Link>
                      <Text component="small">{getBundle(favorite.pathname)}</Text>
                    </TextContent>
                  </SplitItem>
                </Split>
              </GalleryItem>
            ))}
          </Gallery>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default DashboardFavorites;

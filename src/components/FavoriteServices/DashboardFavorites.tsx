import { Gallery, GalleryItem } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import React from 'react';

import useFavoritedServices from '../../hooks/useFavoritedServices';
import EmptyState from '../FavoriteServices/EmptyState';
import { bundleMapping } from '../../hooks/useBundle';
import './DashboardFavorites.scss';
import { Link } from 'react-router-dom';

import PlaceholderIcon from '../AllServicesDropdown/icon-placeholder';

const DashboardFavorites = () => {
  const favoritedServices = useFavoritedServices();

  const getBundle = (href: string) => bundleMapping[href.split('/')[1]];

  const buildFavorites = () => {
    return favoritedServices.map((favorite, index) => (
      <GalleryItem key={index}>
        <Link to={favorite.pathname}>
          <Split>
            <SplitItem className="pf-v5-u-mr-sm">
              <PlaceholderIcon />
            </SplitItem>
            <SplitItem>
              <TextContent>
                <Text component="a" className="pf-v5-u-mb-0">
                  {favorite.name}
                </Text>
                <Text component="small">{getBundle(favorite.pathname)}</Text>
              </TextContent>
            </SplitItem>
          </Split>
        </Link>
      </GalleryItem>
    ));
  };

  return (
    <React.Fragment>
      {favoritedServices.length === 0 ? (
        <EmptyState />
      ) : (
        <React.Fragment>
          <Gallery
            hasGutter
            maxWidths={{
              default: '350px',
            }}
          >
            {buildFavorites()}
          </Gallery>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default DashboardFavorites;

import React from 'react';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';

import ServiceTile, { ServiceTileProps } from './ServiceTile';
import ChromeLink from '../ChromeLink';
import EmptyState from './EmptyState';

const FavoriteServicesGallery = ({ favoritedServices }: { favoritedServices: ServiceTileProps[] }) => {
  return (
    <>
      {favoritedServices.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {favoritedServices.map((props, index) => (
            <ServiceTile {...props} key={index} />
          ))}
          <Alert variant="info" title="Want to add more favorites?" className="pf-v6-u-m-md" isInline>
            Get quick access to your favorite services. To add more services to your favorites,{' '}
            <ChromeLink href="/allservices">View all services</ChromeLink>
          </Alert>
        </>
      )}
    </>
  );
};

export default FavoriteServicesGallery;

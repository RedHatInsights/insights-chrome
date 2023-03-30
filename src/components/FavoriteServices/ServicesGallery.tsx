import React from 'react';
import { Card, CardBody, Gallery, Stack, StackItem, Text, TextContent } from '@patternfly/react-core';
import ServiceTile, { ServiceTileProps } from './ServiceTile';
import ChromeLink from '../ChromeLink';
import { useFavoritePages } from '@redhat-cloud-services/chrome';
import EmptyState from './EmptyState';

const QuickAccess = () => (
  <StackItem className="pf-u-pb-xl">
    Get quick access to your favorite services. To add more services to your Favorites,{' '}
    <ChromeLink href="/allservices">browse all Hybrid Cloud Console services.</ChromeLink>
  </StackItem>
);

const FavoriteServicesGallery = ({ favoritedServices }: { favoritedServices: ServiceTileProps[] }) => {
  const { favoritePages } = useFavoritePages();
  return (
    <Stack>
      <QuickAccess />
      {favoritePages.length === 0 ? (
        <EmptyState />
      ) : (
        <StackItem>
          <Gallery hasGutter>
            {favoritedServices.map((props, index) => (
              <ServiceTile {...props} key={index} />
            ))}
            <Card isPlain className="chr-c-card-centered pf-u-background-color-200">
              <CardBody className="pf-u-pt-lg">
                <TextContent>
                  <Text component="p">Go to the All Services page to tag your favorites.</Text>
                  <Text component="p">
                    <ChromeLink href="/allservices">View all services</ChromeLink>
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
          </Gallery>
        </StackItem>
      )}
    </Stack>
  );
};

export default FavoriteServicesGallery;

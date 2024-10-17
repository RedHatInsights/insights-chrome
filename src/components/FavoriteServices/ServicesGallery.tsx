import React from 'react';
import { Card, CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Gallery } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';

import ServiceTile, { ServiceTileProps } from './ServiceTile';
import ChromeLink from '../ChromeLink';
import EmptyState from './EmptyState';

const FavoriteServicesGallery = ({ favoritedServices }: { favoritedServices: ServiceTileProps[] }) => {
  return (
    <Stack>
      {favoritedServices.length === 0 ? (
        <EmptyState />
      ) : (
        <StackItem>
          <Gallery hasGutter>
            {favoritedServices.map((props, index) => (
              <ServiceTile {...props} key={index} />
            ))}
            <Card isPlain className="chr-c-card-centered pf-v6-u-background-color-200">
              <CardBody className="pf-v6-u-pt-lg">
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

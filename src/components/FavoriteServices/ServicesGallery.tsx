import React from 'react';
import { Card, CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Gallery } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Content,  } from '@patternfly/react-core/dist/dynamic/components/Content';

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
                <Content>
                  <Content component="p">Go to the All Services page to tag your favorites.</Content>
                  <Content component="p">
                    <ChromeLink href="/allservices">View all services</ChromeLink>
                  </Content>
                </Content>
              </CardBody>
            </Card>
          </Gallery>
        </StackItem>
      )}
    </Stack>
  );
};

export default FavoriteServicesGallery;

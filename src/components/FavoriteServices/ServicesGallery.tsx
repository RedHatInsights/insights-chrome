import React from 'react';
import { Menu, MenuContent, MenuGroup, MenuList } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';

import ServiceTile, { ServiceTileProps } from './ServiceTile';
import ChromeLink from '../ChromeLink';
import EmptyState from './EmptyState';
import { bundleMapping } from '../../hooks/useBundle';

type FavoritedBundleProps = {
  bundleName: string;
  services: ServiceTileProps[];
};

const FavoriteServicesGallery = ({ favoritedServices }: { favoritedServices: ServiceTileProps[] }) => {
  const bundles: FavoritedBundleProps[] = [];
  favoritedServices.forEach((service) => {
    const newBundleName = bundleMapping[service.pathname.split('/')[1]];
    if (bundles.some((bundle) => bundle.bundleName === newBundleName)) {
      const index = bundles.findIndex((bundle) => bundle.bundleName === newBundleName);
      bundles[index].services = [...bundles[index].services, service];
    } else {
      bundles.push({
        bundleName: newBundleName,
        services: [service],
      });
    }
  });

  return (
    <>
      {favoritedServices.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Menu isPlain>
            <MenuContent>
              {bundles.map((bundle, index) => (
                <React.Fragment key={`${bundle.bundleName}-${index}`}>
                  {index > 0 && <Divider />}
                  <MenuGroup label={bundle.bundleName}>
                    <MenuList>
                      {bundle.services.map((service) => (
                        <ServiceTile key={service.pathname} {...service} />
                      ))}
                    </MenuList>
                  </MenuGroup>
                </React.Fragment>
              ))}
            </MenuContent>
          </Menu>
          <Alert variant="info" title="Want to add more favorites?" className="pf-v6-u-m-md" isInline>
            Get quick access to your favorite services. To add more services to your favorites, <ChromeLink href="/allservices">View all services</ChromeLink>
          </Alert>
        </>
      )}
    </>
  );
};

export default FavoriteServicesGallery;

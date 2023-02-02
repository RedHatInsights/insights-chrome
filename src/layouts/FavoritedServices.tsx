import React from 'react';

import {
  Card,
  CardBody,
  Gallery,
  Masthead,
  Page,
  PageSection,
  PageSectionVariants,
  Stack,
  StackItem,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';

import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';

import ChromeLink from '../components/ChromeLink';

import './FavoritedServices.scss';
import { useFavoritePages } from '@redhat-cloud-services/chrome';
import EmptyState from '../components/FavoriteServices/EmptyState';
import ServiceTile, { ServiceTileProps } from '../components/FavoriteServices/ServiceTile';
import useAllServices from '../hooks/useAllServices';

export type FavoritedServicesProps = {
  Footer?: React.ReactNode;
};

const QuickAccess = () => (
  <StackItem>
    Get quick access to your favorite services. To add more services to your Favorites,{' '}
    <ChromeLink href="/">browse all Hybrid Cloud Console services.</ChromeLink>
  </StackItem>
);

const FavoritedServices = ({ Footer }: FavoritedServicesProps) => {
  const { favoritePages } = useFavoritePages();
  const { servicesLinks } = useAllServices();

  // extract human friendly data from the all services data set
  const favoritedServices = favoritePages.reduce<ServiceTileProps[]>((acc, curr) => {
    const service = servicesLinks.find(({ isExternal, href }) => !isExternal && href.includes(curr.pathname));
    // only pick favorite link if it is favorited and application exists in our all services registry
    if (curr.favorite && service) {
      return [
        ...acc,
        {
          name: service.title,
          pathname: curr.pathname,
        },
      ];
    }

    return acc;
  }, []);

  return (
    <div id="chrome-app-render-root">
      <Page
        className="chr-c-favoritedservices"
        onPageResize={null} // required to disable PF resize observer that causes re-rendring issue
        header={
          <Masthead className="chr-c-masthead">
            <Header />
          </Masthead>
        }
      >
        <RedirectBanner />
        <PageSection variant={PageSectionVariants.light} className="pf-u-px-2xl-on-md pf-m-fill">
          <Stack className="pf-u-background-color-100">
            <StackItem className="pf-u-pb-md">
              <Title headingLevel="h2">Favorited Services</Title>
            </StackItem>
            <QuickAccess />
            {favoritePages.length === 0 ? (
              <EmptyState />
            ) : (
              <StackItem className="pf-u-pt-xl">
                <Gallery hasGutter>
                  {favoritedServices.map((props, index) => (
                    <ServiceTile {...props} key={index} />
                  ))}
                  <Card isPlain className="chr-c-card-centered pf-u-background-color-200">
                    <CardBody className="pf-u-pt-lg">
                      <TextContent>
                        <Text component="p">Go to the All Services page to tag your favorites.</Text>
                        <Text component="p">
                          <ChromeLink href="/">View all services</ChromeLink>
                        </Text>
                      </TextContent>
                    </CardBody>
                  </Card>
                </Gallery>
              </StackItem>
            )}
          </Stack>
        </PageSection>
        {Footer}
      </Page>
    </div>
  );
};
export default FavoritedServices;

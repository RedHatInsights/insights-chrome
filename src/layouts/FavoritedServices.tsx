import React from 'react';

import { Masthead, Page, PageSection, PageSectionVariants, Stack, StackItem, Title } from '@patternfly/react-core';

import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';

import ChromeLink from '../components/ChromeLink';

import './FavoritedServices.scss';
import { useFavoritePages } from '@redhat-cloud-services/chrome';
import EmptyState from '../components/FavoriteServices/EmptyState';
import FavoriteServicesGallery from '../components/FavoriteServices/ServicesGallery';
import useFavoritedServices from '../hooks/useFavoritedServices';

export type FavoritedServicesProps = {
  Footer?: React.ReactNode;
};

const QuickAccess = () => (
  <StackItem>
    Get quick access to your favorite services. To add more services to your Favorites,{' '}
    <ChromeLink href="/allservices">browse all Hybrid Cloud Console services.</ChromeLink>
  </StackItem>
);

const FavoritedServices = ({ Footer }: FavoritedServicesProps) => {
  const { favoritePages } = useFavoritePages();
  const favoritedServices = useFavoritedServices();

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
                <FavoriteServicesGallery favoritedServices={favoritedServices} />
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

import React from 'react';

import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Page, PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';

import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import EmptyState from '../components/FavoriteServices/EmptyState';
import FavoriteServicesGallery from '../components/FavoriteServices/ServicesGallery';
import useFavoritedServices from '../hooks/useFavoritedServices';

import './FavoritedServices.scss';
import { updateDocumentTitle } from '../utils/common';

export type FavoritedServicesProps = {
  Footer?: React.ReactNode;
};

const FavoritedServices = ({ Footer }: FavoritedServicesProps) => {
  updateDocumentTitle('Favorited Services', true);
  const favoritedServices = useFavoritedServices();
  return (
    <div id="chrome-app-render-root">
      <Page
        className="chr-c-favoritedservices"
        onPageResize={null} // required to disable PF resize observer that causes re-rendring issue
        masthead={
          <Masthead className="chr-c-masthead">
            <Header />
          </Masthead>
        }
      >
        <RedirectBanner />
        <PageSection hasBodyWrapper={false} className="pf-v6-u-px-2xl-on-md pf-v6-m-fill">
          <Stack className="pf-v6-u-background-color-100">
            <StackItem className="pf-v6-u-pb-md">
              <Title headingLevel="h2">Favorited Services</Title>
            </StackItem>
            {favoritedServices.length === 0 ? (
              <EmptyState />
            ) : (
              <StackItem>
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

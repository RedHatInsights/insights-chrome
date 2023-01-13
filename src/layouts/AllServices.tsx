import React, { useEffect } from 'react';

import { Gallery, Masthead, Page, PageSection, PageSectionVariants, Stack, StackItem, Title } from '@patternfly/react-core';

import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import Footer from '../components/Footer/Footer';
import AllServicesSection from '../components/AllServices/AllServicesSection';
import allServicesLinks from '../components/AllServices/allServicesLinks';

import './AllServices.scss';
import { updateDocumentTitle } from '../utils/common';

const AllServices = () => {
  useEffect(() => {
    updateDocumentTitle('All services');
  }, []);
  return (
    <div id="chrome-app-render-root">
      <Page
        onPageResize={null} // required to disable PF resize observer that causes re-rendring issue
        header={
          <Masthead className="chr-c-masthead">
            <Header />
          </Masthead>
        }
      >
        <div className="chr-render">
          <RedirectBanner />
          <PageSection variant={PageSectionVariants.light} className="pf-m-fill">
            <Stack className="chr-l-stack-allservices pf-u-background-color-100">
              <StackItem className="sticky pf-u-background-color-100">
                <StackItem className="pf-u-pl-lg pf-u-pb-md">
                  <Title headingLevel="h2">All Services</Title>
                </StackItem>
              </StackItem>
              <StackItem>
                <Gallery hasGutter>
                  {allServicesLinks.map((section, index) => (
                    <AllServicesSection key={index} {...section} />
                  ))}
                </Gallery>
              </StackItem>
            </Stack>
          </PageSection>
          <Footer />
        </div>
      </Page>
    </div>
  );
};
export default AllServices;

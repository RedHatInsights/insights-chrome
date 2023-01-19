import React, { useEffect } from 'react';

import { Gallery, Masthead, Page, PageSection, PageSectionVariants, Stack, StackItem, Title } from '@patternfly/react-core';

import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import Footer from '../components/Footer/Footer';
import AllServicesSection from '../components/AllServices/AllServicesSection';

import './AllServices.scss';
import { updateDocumentTitle } from '../utils/common';
import useAllServices from '../hooks/useAllServices';

const AllServices = () => {
  const { linkSections, error, ready } = useAllServices();
  useEffect(() => {
    updateDocumentTitle('All services');
  }, []);

  if (!ready) {
    // TODO: Add loading state
    return <div>Loading</div>;
  }

  if (error) {
    // TODO: Add error state
    return <div>Error</div>;
  }
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
                  {linkSections.map((section, index) => (
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

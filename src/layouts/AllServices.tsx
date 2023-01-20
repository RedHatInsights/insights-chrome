import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { Gallery, Masthead, Page, PageSection, PageSectionVariants, SearchInput, Stack, StackItem, Title } from '@patternfly/react-core';

import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import AllServicesSection from '../components/AllServices/AllServicesSection';

import './AllServices.scss';
import { updateDocumentTitle } from '../utils/common';
import useAllServices from '../hooks/useAllServices';
import Messages from '../locales/Messages';

export type AllServicesProps = {
  Footer?: React.FC;
};

const AllServices = ({ Footer }: AllServicesProps) => {
  const { linkSections, error, ready, filterValue, setFilterValue } = useAllServices();
  const intl = useIntl();

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
            <Stack className="chr-l-stack-allservices">
              <StackItem className="sticky pf-u-background-color-100">
                <StackItem className="pf-u-pl-lg pf-u-pb-md">
                  <Title headingLevel="h2">All Services</Title>
                </StackItem>
                <StackItem className="pf-u-pl-lg pf-u-pb-md-on-md">
                  <SearchInput
                    className="chr-c-all-services-filter"
                    data-ouia-component-id="app-filter-search"
                    placeholder={intl.formatMessage(Messages.findAppOrService)}
                    value={filterValue}
                    onChange={(val) => setFilterValue(val)}
                    onClear={(e) => {
                      setFilterValue('');
                      e.stopPropagation();
                    }}
                  />
                </StackItem>
              </StackItem>
              <StackItem>
                <Gallery hasGutter>
                  {linkSections.map((section, index) => (
                    <AllServicesSection key={index} {...section} />
                  ))}
                  {/* TODO: Add empty state */}
                  {linkSections.length === 0 && filterValue.length !== 0 && <div>Nothing found</div>}
                </Gallery>
              </StackItem>
            </Stack>
          </PageSection>
          {Footer && <Footer />}
        </div>
      </Page>
    </div>
  );
};
export default AllServices;

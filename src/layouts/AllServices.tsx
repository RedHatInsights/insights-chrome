import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { Gallery, Masthead, Page, PageSection, PageSectionVariants, SearchInput, Title } from '@patternfly/react-core';

import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import AllServicesSection from '../components/AllServices/AllServicesSection';

import './AllServices.scss';
import { updateDocumentTitle } from '../utils/common';
import useAllServices from '../hooks/useAllServices';
import Messages from '../locales/Messages';

export type AllServicesProps = {
  Footer?: React.ReactNode;
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
          <PageSection variant={PageSectionVariants.light} className="chr-c-all-services pf-m-fill">
            <div className="pf-u-px-lg pf-u-pb-md pf-u-background-color-100 sticky">
              <Title headingLevel="h2">All Services</Title>
              <SearchInput
                className="chr-c-all-services-filter pf-u-m-auto pf-u-mt-lg"
                data-ouia-component-id="app-filter-search"
                placeholder={intl.formatMessage(Messages.findAppOrService)}
                value={filterValue}
                onChange={(val) => setFilterValue(val)}
                onClear={(e) => {
                  setFilterValue('');
                  e.stopPropagation();
                }}
              />
            </div>
            <Gallery className="pf-u-display-block" hasGutter>
              {linkSections.map((section, index) => (
                <AllServicesSection key={index} {...section} />
              ))}
              {/* TODO: Add empty state */}
              {linkSections.length === 0 && filterValue.length !== 0 && <div>Nothing found</div>}
            </Gallery>
          </PageSection>
          {Footer}
        </div>
      </Page>
    </div>
  );
};
export default AllServices;

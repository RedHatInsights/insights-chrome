import React, { Fragment, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Bullseye, Gallery, Masthead, Page, PageGroup, PageSection, PageSectionVariants, SearchInput, Spinner, Title } from '@patternfly/react-core';
import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import AllServicesSection from '../components/AllServices/AllServicesSection';

import './AllServices.scss';
import { updateDocumentTitle } from '../utils/common';
import useAllServices from '../hooks/useAllServices';
import Messages from '../locales/Messages';
import AllServicesIcons from '../components/AllServices/AllServicesIcons';
import type {AllServicesSection as AllServicesSectionType} from '../components/AllServices/allServicesLinks';

export type AllServicesProps = {
  Footer?: React.ReactNode;
};

const AllServices = ({ Footer }: AllServicesProps) => {
  const { linkSections, error, ready, filterValue, setFilterValue } = useAllServices();
  const intl = useIntl();

  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(12);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [selectedService, setSelectedService] = React.useState<AllServicesSectionType>(linkSections[0]);

  if (error) {
    // TODO: Add error state
    return <div>Error</div>;
  }

  const contentRef1 = React.createRef<HTMLElement>();

  return (
    <div id="chrome-app-render-root">
      <Page
        className="chr-c-all-services"
        onPageResize={null} // required to disable PF resize observer that causes re-rendring issue
        header={
          <Masthead className="chr-c-masthead">
            <Header />
          </Masthead>
        }
      >
        <RedirectBanner />
        {!ready ? (
          <Bullseye>
            <Spinner size="xl" />
          </Bullseye>
        ) : (
          <Fragment>
            <PageGroup stickyOnBreakpoint={{ default: 'top' }}>
              <PageSection variant={PageSectionVariants.light} className="pf-u-px-2xl-on-md">
                <Title headingLevel="h2">All Services</Title>
                <SearchInput
                  className="chr-c-all-services-filter pf-u-m-auto pf-u-mt-md"
                  data-ouia-component-id="app-filter-search"
                  placeholder={intl.formatMessage(Messages.findAppOrService)}
                  value={filterValue}
                  onChange={(val) => setFilterValue(val)}
                  onClear={(e) => {
                    setFilterValue('');
                    e.stopPropagation();
                  }}
                />
              </PageSection>
            </PageGroup>
            <PageSection padding={{ default: 'noPadding', md: 'padding', lg: 'padding' }}>
              <Gallery className="pf-u-display-block" hasGutter>
                {linkSections.map((section, index) => (
                  <AllServicesSection key={index} {...section} />
                ))}
                {/* TODO: Add empty state */}
                {linkSections.length === 0 && filterValue.length !== 0 && <div>Nothing found</div>}
              </Gallery>
            </PageSection>
          </Fragment>
        )}
        {Footer}
      </Page>
    </div>
  );
};
export default AllServices;

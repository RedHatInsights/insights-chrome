import React, { Fragment } from 'react';
import { useIntl } from 'react-intl';
import {
  Bullseye,
  Gallery,
  Icon,
  Masthead,
  Page,
  PageGroup,
  PageSection,
  PageSectionVariants,
  SearchInput,
  Spinner,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';
import FilterIcon from '@patternfly/react-icons/dist/js/icons/filter-icon';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';
import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import AllServicesSection from '../components/AllServices/AllServicesSection';

import './AllServices.scss';
import useAllServices from '../hooks/useAllServices';
import Messages from '../locales/Messages';
import { ITLess } from '../utils/common';

export type AllServicesProps = {
  Footer?: React.ReactNode;
};

const AllServices = ({ Footer }: AllServicesProps) => {
  const { linkSections, error, ready, filterValue, setFilterValue } = useAllServices();
  const intl = useIntl();

  if (error) {
    // TODO: Add error state
    return <div>Error</div>;
  }

  const sections = ITLess() ? linkSections.filter((section) => section.ITLess) : linkSections;

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
              <PageSection variant={PageSectionVariants.light} className="pf-u-px-xl-on-md">
                <Title headingLevel="h2">All Services</Title>
                <TextContent className="pf-u-mt-sm">
                  <Text component="p">
                    Every service available on Hybrid Cloud Console appears below. Hover on a service to select it as a favorite.
                    <Icon status="warning" size="md" className="pf-u-pl-sm" isInline>
                      <StarIcon />
                    </Icon>
                  </Text>
                </TextContent>
                <Icon className="chr-c-icon-filter">
                  <FilterIcon />
                </Icon>
                <SearchInput
                  className="chr-c-all-services-filter pf-u-mt-md pf-u-mb-sm"
                  data-ouia-component-id="app-filter-search"
                  placeholder={intl.formatMessage(Messages.findAppOrService)}
                  value={filterValue}
                  onChange={(_e, val) => setFilterValue(val)}
                  onClear={(e) => {
                    setFilterValue('');
                    e.stopPropagation();
                  }}
                />
              </PageSection>
            </PageGroup>
            <PageSection padding={{ default: 'noPadding', md: 'padding', lg: 'padding' }}>
              <Gallery className="pf-u-display-block" hasGutter>
                {sections.map((section, index) => (
                  <AllServicesSection key={index} {...section} />
                ))}
                {/* TODO: Add empty state */}
                {sections.length === 0 && filterValue.length !== 0 && <div>Nothing found</div>}
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

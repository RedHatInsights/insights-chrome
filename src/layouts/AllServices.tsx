import React, { Fragment } from 'react';
import { useIntl } from 'react-intl';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Gallery } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Page, PageGroup, PageSection,  } from '@patternfly/react-core/dist/dynamic/components/Page';
import { SearchInput } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Content,  } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import FilterIcon from '@patternfly/react-icons/dist/dynamic/icons/filter-icon';
import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';
import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import AllServicesSection from '../components/AllServices/AllServicesSection';

import './AllServices.scss';
import useAllServices from '../hooks/useAllServices';
import Messages from '../locales/Messages';
import { ITLess, updateDocumentTitle } from '../utils/common';

export type AllServicesProps = {
  Footer?: React.ReactNode;
};

const AllServices = ({ Footer }: AllServicesProps) => {
  updateDocumentTitle('All Services', true);
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
        masthead={
          <Masthead className="chr-c-masthead pf-v6-u-p-0" display={{ sm: 'stack', '2xl': 'inline' }}>
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
              <PageSection hasBodyWrapper={false}  className="pf-v6-u-px-xl-on-md">
                <Title headingLevel="h2">All Services</Title>
                <Content className="pf-v6-u-mt-sm">
                  <Content component="p">
                    Every service available on Hybrid Cloud Console appears below. Hover over a service and click the star to add it to your
                    favorites.
                    <Icon status="warning" size="md" className="pf-v6-u-pl-sm" isInline>
                      <StarIcon />
                    </Icon>
                  </Content>
                </Content>
                <Icon className="chr-c-icon-filter">
                  <FilterIcon />
                </Icon>
                <SearchInput
                  className="chr-c-all-services-filter pf-v6-u-mt-md pf-v6-u-mb-sm"
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
            <PageSection hasBodyWrapper={false} padding={{ default: 'noPadding', md: 'padding', lg: 'padding' }}>
              <Gallery className="pf-v6-u-display-block" hasGutter>
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

import React, { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Gallery } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Page, PageGroup, PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { SearchInput } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import FilterIcon from '@patternfly/react-icons/dist/dynamic/icons/filter-icon';
import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';
import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import AllServicesSection from '../components/AllServices/AllServicesSection';
import './AllServices.scss';
import useAllServices from '../hooks/useAllServices';
import Messages from '../locales/Messages';
import { updateDocumentTitle } from '../utils/common';
import { useFlag } from '@unleash/proxy-client-react';
import AllServicesBundle from '../components/AllServices/AllServicesBundle';
import { BundleNavigation } from '../@types/types';
import filterNavItemsByTitle from '../utils/filterNavItemsByTitle';
import { fetchBundles } from '../hooks/useAllLinks';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateActions } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateFooter } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';

const availableBundles = ['openshift', 'insights', 'ansible', 'settings', 'iam', 'subscriptions'];

export type AllServicesProps = {
  Footer?: React.ReactNode;
};

const AllServices = ({ Footer }: AllServicesProps) => {
  const [bundles, setBundles] = useState<BundleNavigation[]>([]);
  const [originalBundles, setOriginalBundles] = useState<BundleNavigation[]>([]);
  const enableAllServicesRedesign = useFlag('platform.chrome.allservices.redesign');
  updateDocumentTitle('All Services', true);
  const { linkSections, error, ready, filterValue, setFilterValue } = useAllServices();
  const intl = useIntl();

  if (error) {
    return <div>Error</div>;
  }

  const otherServicesBundle: BundleNavigation = {
    id: 'otherServices',
    title: 'Other Services',
    navItems: [
      { id: 'redhatProductTrials', title: 'Red Hat Product Trials', isExternal: true },
      { id: 'trustedArtifactSigner', title: 'Trusted Artifact Signer', isExternal: true },
      { id: 'trustedAnalyzer', title: 'Trusted Profile Analyzer', isExternal: true },
    ],
  };

  const fetchNavigation = async () => {
    const fetchNav = await fetchBundles();
    const filteredBundles = fetchNav.filter(({ id }) => availableBundles.includes(id));
    const withOthers = filteredBundles.concat(otherServicesBundle);
    setOriginalBundles(withOthers);
    setBundles(withOthers);
  };

  useEffect(() => {
    if (enableAllServicesRedesign) {
      fetchNavigation();
    }
  }, [enableAllServicesRedesign]);

  useEffect(() => {
    if (!filterValue) {
      setBundles(originalBundles);
    } else {
      const filtered = originalBundles
        .map((bundle) => {
          const filteredNavItems = filterNavItemsByTitle(bundle.navItems, filterValue);
          return filteredNavItems.length > 0 ? { ...bundle, navItems: filteredNavItems } : null;
        })
        .filter((bundle): bundle is BundleNavigation => bundle !== null);
      setBundles(filtered);
    }
  }, [filterValue, originalBundles]);

  const sections = linkSections;

  return (
    <div id="chrome-app-render-root">
      <Page
        className="chr-c-all-services"
        onPageResize={null} // required to disable PF resize observer that causes re-rendring issue
        masthead={
          <Masthead className="chr-c-masthead" display={{ sm: 'stack', '2xl': 'inline' }}>
            <Header breadcrumbsProps={{ hideNav: true }} />
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
              <PageSection hasBodyWrapper={false} className="pf-v6-u-px-xl-on-md">
                <Title headingLevel="h2">All Services</Title>
                <Content>
                  <Content component="p">
                    Every service available on Hybrid Cloud Console appears below. Hover over a service and click the star ({' '}
                    <Icon status="warning" size="md" isInline>
                      <StarIcon />
                    </Icon>{' '}
                    ) to add it to your favorites.
                  </Content>
                </Content>
                <span className="pf-v6-u-display-inline-flex pf-v6-u-pl-sm pf-v6-u-ml-xs">
                  <Icon className="chr-c-icon-filter">
                    <FilterIcon />
                  </Icon>
                  <SearchInput
                    className="chr-c-all-services-filter"
                    data-ouia-component-id="app-filter-search"
                    placeholder={intl.formatMessage(Messages.findAppOrService)}
                    value={filterValue}
                    onChange={(_e, val) => setFilterValue(val)}
                    onClear={(e) => {
                      setFilterValue('');
                      e.stopPropagation();
                    }}
                  />
                </span>
              </PageSection>
            </PageGroup>
            <PageSection hasBodyWrapper={false} padding={{ default: 'noPadding', md: 'padding', lg: 'padding' }} className="pf-v6-u-pt-lg">
              <Gallery className="pf-v6-u-display-block" hasGutter>
                {enableAllServicesRedesign
                  ? bundles.map((bundle) => <AllServicesBundle key={bundle.id} {...bundle} />)
                  : sections.map((section, index) => <AllServicesSection key={index} {...section} />)}
              </Gallery>
              {(sections.length === 0 || (enableAllServicesRedesign && bundles.length === 0)) && filterValue.length !== 0 && (
                <Bullseye>
                  <EmptyState titleText="No results found" headingLevel="h4" icon={SearchIcon}>
                    <EmptyStateBody>No results match the filter criteria. Clear all filters and try again.</EmptyStateBody>
                    <EmptyStateFooter>
                      <EmptyStateActions>
                        <Button
                          variant="link"
                          onClick={(e) => {
                            e.preventDefault();
                            setFilterValue('');
                          }}
                        >
                          Clear all filters
                        </Button>
                      </EmptyStateActions>
                    </EmptyStateFooter>
                  </EmptyState>
                </Bullseye>
              )}
            </PageSection>
          </Fragment>
        )}
        {Footer}
      </Page>
    </div>
  );
};

export default AllServices;

import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { Gallery, Masthead, Page, PageGroup, PageSection, PageSectionVariants, Panel, PanelMain, SearchInput, Sidebar, Split, SplitItem, Title } from '@patternfly/react-core';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardActions,
  CardTitle,
  Tabs,
  Tab,
  TabContent,
  TabTitleText,
  SidebarContent,
  SidebarPanel
} from "@patternfly/react-core";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import ShoppingCartIcon from '@patternfly/react-icons/dist/js/icons/shopping-cart-icon';
import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import AllServicesSection from '../components/AllServices/AllServicesSection';

import './AllServices.scss';
import { updateDocumentTitle } from '../utils/common';
import useAllServices from '../hooks/useAllServices';
import Messages from '../locales/Messages';
import AllServicesIcons from '../components/AllServices/AllServicesIcons';

export type AllServicesProps = {
  Footer?: React.ReactNode;
};

const AllServices = ({ Footer }: AllServicesProps) => {
  const { linkSections, error, ready, filterValue, setFilterValue } = useAllServices();
  const intl = useIntl();

  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(1);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  // Toggle currently active tab
  const handleTabClick = (
    event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number
  ) => {
    setActiveTabKey(tabIndex);
  };

  const onToggle = (isExpanded: boolean) => {
    setIsExpanded(isExpanded);
  };

  const convertTitleIcon = (icon: keyof typeof AllServicesIcons) => {
    const TitleIcon = AllServicesIcons[icon]
    return <TitleIcon />
  }

  const contentRef1 = React.createRef<HTMLElement>();
  const contentRef2 = React.createRef<HTMLElement>();
  const contentRef3 = React.createRef<HTMLElement>();

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
    <Panel variant="raised" className="chr-c-navtest">
      <PanelMain>
        <Sidebar>
          <SidebarPanel>
            {" "}
            <Tabs
              inset={{
                default: "insetNone"
              }}
              activeKey={activeTabKey}
              onSelect={handleTabClick}
              isVertical
              expandable={{
                default: "expandable",
                md: "nonExpandable"
              }}
              isExpanded={isExpanded}
              onToggle={onToggle}
              toggleText="Containers"
              aria-label="Tabs in the vertical expandable example"
              role="region"
            >
            {linkSections.map((section, index) => (
              <Tab
                eventKey={index}
                title={<TabTitleText>{section.title}</TabTitleText>}
                tabContentId="refTab1Section"
                tabContentRef={contentRef1}
              />
            ))}
            </Tabs>
          </SidebarPanel>
          <SidebarContent>
            {linkSections.map((section, index) => (
              <Card isPlain>
              <CardHeader>
                <Title headingLevel="h2">{convertTitleIcon(section.icon)} &nbsp;{section.title}</Title>
                <CardActions>
                  <Button variant="plain" aria-label="Close menu">
                    <TimesIcon />
                  </Button>
                </CardActions>
              </CardHeader>
              <CardBody>
                <TabContent
                  eventKey={index}
                  id="refTab1Section"
                  ref={contentRef1}
                  aria-label={section.description}
                >
                  <Gallery hasGutter>
                    {section.links.map((link, index) => (
                      <Card isFlat>
                      <CardBody>
                        <Split>
                          <SplitItem className="pf-m-fill">
                          </SplitItem>
                          <SplitItem>
                          </SplitItem>
                        </Split>
                        {link.title}
                      </CardBody>
                    </Card>
                    ))}
                  </Gallery>
                </TabContent>
              </CardBody>
            </Card>
            ))}
          </SidebarContent>
        </Sidebar>
      </PanelMain>
    </Panel>
        </PageSection>
        {Footer}
      </Page>
    </div>
  );
};
export default AllServices;

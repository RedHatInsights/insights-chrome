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
import type {AllServicesSection as AllServicesSectionType} from '../components/AllServices/allServicesLinks';

export type AllServicesProps = {
  Footer?: React.ReactNode;
};

const AllServices = ({ Footer }: AllServicesProps) => {
  const { linkSections, error, ready, filterValue, setFilterValue } = useAllServices();
  const intl = useIntl();

  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(1);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [selectedService, setSelectedService] = React.useState<AllServicesSectionType>(linkSections[1]);
  // Toggle currently active tab
  const handleTabClick = (
    event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number
  ) => {
    setActiveTabKey(tabIndex);
    console.log(selectedService)
  };

  const onTabClick = (section: AllServicesSectionType, index: number) => {
    setSelectedService(section);
    setActiveTabKey(index);
  };

  const onToggle = (isExpanded: boolean) => {
    setIsExpanded(isExpanded);
  };

  const convertTitleIcon = (icon: keyof typeof AllServicesIcons) => {
    const TitleIcon = AllServicesIcons[icon]
    return <TitleIcon />
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

        <PageSection padding={{ default: 'noPadding', md: 'padding', lg: 'padding' }}>
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
                onClick={() => onTabClick(section, index)}
              />
            ))}
            </Tabs>
          </SidebarPanel>
          <SidebarContent>
              <Card isPlain>
              <CardHeader>
                <Title headingLevel="h2">{convertTitleIcon(selectedService.icon)} &nbsp;{selectedService.title}</Title>
                <CardActions>
                  <Button variant="plain" aria-label="Close menu">
                    <TimesIcon />
                  </Button>
                </CardActions>
              </CardHeader>
              <CardBody>
                <TabContent
                  eventKey={activeTabKey}
                  id="refTab1Section"
                  ref={contentRef1}
                  aria-label={selectedService.description}
                >
                  <Gallery hasGutter>
                    {selectedService.links.map((link, index) => (
                      <Card isFlat>
                        <CardHeader>
                          {link.title}
                        </CardHeader>
                        <CardBody>
                          <Split>
                            <SplitItem className="pf-m-fill">
                            </SplitItem>
                            <SplitItem>
                            </SplitItem>
                          </Split>
                          description here please
                        </CardBody>
                      </Card>
                    ))}
                  </Gallery>
                </TabContent>
              </CardBody>
            </Card>
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

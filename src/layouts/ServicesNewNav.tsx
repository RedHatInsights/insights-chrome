import React from 'react';
import { Icon, Gallery, Masthead, Page, PageSection, Panel, PanelMain, Sidebar, Split, SplitItem, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';
import {
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  Divider,
  SidebarContent,
  SidebarPanel,
  Tab,
  TabContent,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';
import ChromeLink from '../components/ChromeLink';
import BookOpenIcon from '@patternfly/react-icons/dist/esm/icons/book-open-icon';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import useAllServices from '../hooks/useAllServices';
import AllServicesIcons from '../components/AllServices/AllServicesIcons';
import type { AllServicesGroup, AllServicesLink, AllServicesSection as AllServicesSectionType } from '../components/AllServices/allServicesLinks';
import './ServicesNewNav.scss';

export type ServicesNewNavProps = {
  Footer?: React.ReactNode;
};

const ServicesNewNav = ({ Footer }: ServicesNewNavProps) => {
  const { linkSections } = useAllServices();
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(12);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [selectedService, setSelectedService] = React.useState<AllServicesSectionType>(linkSections[0]);

  // Toggle currently active tab
  const handleTabClick = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  const onTabClick = (section: AllServicesSectionType, index: number) => {
    setSelectedService(section);
    setActiveTabKey(index);
  };

  const onToggle = (isExpanded: boolean) => {
    setIsExpanded(isExpanded);
  };

  const convertTitleIcon = (icon: keyof typeof AllServicesIcons) => {
    const TitleIcon = AllServicesIcons[icon];
    return <TitleIcon />;
  };

  const linkDescription = (link: AllServicesLink | AllServicesGroup) => {
    if (link.description) {
      return link.description;
    } else {
      return '';
    }
  };

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
        <PageSection padding={{ default: 'noPadding'}}>
          <Panel variant="raised" className="chr-c-panel-services-nav">
            <PanelMain>
              <Sidebar className="pf-u-pt-md pf-u-pt-0-on-md">
                <SidebarPanel>
                  {' '}
                  <Tabs
                    inset={{
                      default: 'insetNone',
                    }}
                    activeKey={activeTabKey}
                    onSelect={handleTabClick}
                    isVertical
                    expandable={{
                      default: 'expandable',
                      md: 'nonExpandable',
                    }}
                    isExpanded={isExpanded}
                    onToggle={onToggle}
                    toggleText="Containers"
                    aria-label="Tabs in the vertical expandable example"
                    role="region"
                    className="pf-u-pl-md"
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
                  <Divider inset={{ default: 'insetNone' }} className="pf-u-py-md" />
                  <TextContent className="pf-u-pb-md pf-u-pl-lg">
                    <Text component={TextVariants.p}>
                      <ChromeLink href="/allservices">
                        <Icon className="pf-u-mr-sm" isInline>
                          <BookOpenIcon />
                        </Icon>
                        Browse all cloud services
                      </ChromeLink>
                    </Text>
                  </TextContent>
                </SidebarPanel>
                <SidebarContent>
                  <Card isPlain>
                    <CardHeader>
                      <Title headingLevel="h2">
                        {convertTitleIcon(selectedService.icon)} &nbsp;{selectedService.title}
                      </Title>
                      <CardActions>
                        <Button variant="plain" aria-label="Close menu">
                          <TimesIcon />
                        </Button>
                      </CardActions>
                    </CardHeader>
                    <CardBody>
                      <TabContent eventKey={activeTabKey} id="refTab1Section" ref={contentRef1} aria-label={selectedService.description}>
                        <Gallery hasGutter>
                          {selectedService.links.map((link) => (
                            <Card isFlat isSelectableRaised>
                              <CardBody className="pf-u-p-md">
                                <Split>
                                  <SplitItem className="pf-m-fill">{link.title}</SplitItem>
                                  <SplitItem>
                                    <Icon className="chr-c-icon-service-card">
                                      <StarIcon />
                                    </Icon>
                                  </SplitItem>
                                </Split>
                                <TextContent>
                                  <Text component="small">bundle name</Text>
                                  <Text component="small" className="pf-u-color-100">{linkDescription(link)}</Text>
                                </TextContent>
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
export default ServicesNewNav;

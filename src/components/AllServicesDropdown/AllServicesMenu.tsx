import React, { useEffect } from 'react';
import { Backdrop, Gallery, Icon, Panel, PanelMain, Sidebar, Split, SplitItem, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';
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
import ChromeLink from '../ChromeLink';
import BookOpenIcon from '@patternfly/react-icons/dist/esm/icons/book-open-icon';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import useAllServices from '../../hooks/useAllServices';
import AllServicesIcons from '../AllServices/AllServicesIcons';
import type { AllServicesGroup, AllServicesLink, AllServicesSection as AllServicesSectionType } from '../AllServices/allServicesLinks';
import { useLocation } from 'react-router-dom';
import { bundleMapping } from '../../hooks/useBundle';
import FavoriteServicesGallery from '../FavoriteServices/ServicesGallery';
import useFavoritedServices from '../../hooks/useFavoritedServices';

export type AllServicesMenuProps = {
  isLoaded: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement>;
};

const TAB_CONTENT_ID = 'refTab1Section';
const FAVORITE_TAB_ID = 'favorites';

const AllServicesMenu = ({ isLoaded, setIsOpen, isOpen, menuRef }: AllServicesMenuProps) => {
  const { pathname } = useLocation();
  const { linkSections } = useAllServices();
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(FAVORITE_TAB_ID);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [selectedService, setSelectedService] = React.useState<AllServicesSectionType>(linkSections[0]);
  const favoritedServices = useFavoritedServices();

  useEffect(() => {
    if (isLoaded) {
      setIsOpen(false);
    }
  }, [pathname]);

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

  const getBundle = (link: AllServicesLink) => {
    if (link.href) {
      return bundleMapping[link.href.split('/')[1]];
    }
  };

  const contentRef1 = React.createRef<HTMLElement>();

  return (
    <div ref={menuRef} className="pf-c-dropdown chr-c-page__services-nav-dropdown-menu" data-testid="chr-c__find-app-service">
      <Backdrop>
        <Panel variant="raised" className="pf-c-dropdown__menu pf-u-p-0 pf-u-w-100 chr-c-panel-services-nav ">
          <PanelMain>
            <Sidebar className="pf-u-pt-md pf-u-pt-0-on-md">
              <SidebarPanel>
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
                  <Tab
                    eventKey={FAVORITE_TAB_ID}
                    title={
                      <TabTitleText>
                        My favorite services
                        <Icon className="pf-u-ml-md" status="warning">
                          <StarIcon size="sm" className="chr-c-icon-service-tab" />
                        </Icon>
                      </TabTitleText>
                    }
                  />
                  {linkSections.map((section, index) => (
                    <Tab
                      key={index}
                      eventKey={index}
                      title={<TabTitleText>{section.title}</TabTitleText>}
                      tabContentId={TAB_CONTENT_ID}
                      tabContentRef={contentRef1}
                      onClick={() => onTabClick(section, index)}
                    />
                  ))}
                </Tabs>
                <Divider inset={{ default: 'insetNone' }} className="pf-u-pt-md pf-u-pb-sm" />
                <TextContent className="pf-u-pb-md pf-u-text-align-center">
                  <Text component={TextVariants.p}>
                    <ChromeLink href="/allservices">
                      <Icon className="pf-u-mr-sm" isInline>
                        <BookOpenIcon />
                      </Icon>
                      Browse all services
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
                      <Button variant="plain" aria-label="Close menu" onClick={() => setIsOpen(!isOpen)}>
                        <TimesIcon />
                      </Button>
                    </CardActions>
                  </CardHeader>
                  <CardBody>
                    <TabContent eventKey={activeTabKey} id={TAB_CONTENT_ID} ref={contentRef1} aria-label={selectedService.description}>
                      {activeTabKey === FAVORITE_TAB_ID ? (
                        <FavoriteServicesGallery favoritedServices={favoritedServices} />
                      ) : (
                        <Gallery hasGutter>
                          {selectedService.links.map((link, index) => (
                            <ChromeLink key={index} href={(link as AllServicesLink).href} className="chr-c-favorite-service__tile">
                              <Card className="chr-c-link-service-card" isFlat isSelectableRaised>
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
                                    <Text component="small">{getBundle(link as AllServicesLink)}</Text>
                                    <Text component="small" className="pf-u-color-100">
                                      {linkDescription(link)}
                                    </Text>
                                  </TextContent>
                                </CardBody>
                              </Card>
                            </ChromeLink>
                          ))}
                        </Gallery>
                      )}
                    </TabContent>
                  </CardBody>
                </Card>
              </SidebarContent>
            </Sidebar>
          </PanelMain>
        </Panel>
      </Backdrop>
    </div>
  );
};

export default AllServicesMenu;

import React, { Fragment } from 'react';
import {
  Backdrop,
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  FlexItem,
  Icon,
  Panel,
  PanelMain,
  Sidebar,
  SidebarContent,
  SidebarPanel,
  TabContent,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core';

import ChromeLink from '../ChromeLink';
import BookOpenIcon from '@patternfly/react-icons/dist/js/icons/book-open-icon';
import TimesIcon from '@patternfly/react-icons/dist/js/icons/times-icon';
import type { AllServicesSection } from '../AllServices/allServicesLinks';
import FavoriteServicesGallery from '../FavoriteServices/ServicesGallery';
import AllServicesTabs from './AllServicesTabs';
import AllServicesGallery from './AllServicesGallery';
import { ServiceTileProps } from '../FavoriteServices/ServiceTile';
import QuickAccess from '../FavoriteServices/QuickAccess';
import { AllServicesDropdownContext } from './common';

export type AllServicesMenuProps = {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement>;
  linkSections: AllServicesSection[];
  favoritedServices: ServiceTileProps[];
};

const TAB_CONTENT_ID = 'refTab1Section';
const FAVORITE_TAB_ID = 'favorites';

const AllServicesMenu = ({ setIsOpen, isOpen, menuRef, linkSections, favoritedServices }: AllServicesMenuProps) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(FAVORITE_TAB_ID);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [selectedService, setSelectedService] = React.useState<AllServicesSection>(linkSections[0]);

  // Toggle currently active tab
  const handleTabClick = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  const onTabClick = (section: AllServicesSection, index: number) => {
    setSelectedService(section);
    setActiveTabKey(index);
  };

  const onToggle = (isExpanded: boolean) => {
    setIsExpanded(isExpanded);
  };

  const tabContentRef = React.createRef<HTMLElement>();

  return (
    <AllServicesDropdownContext.Provider
      value={{
        onLinkClick() {
          // close modal on any link click
          setIsOpen(false);
        },
      }}
    >
      <div ref={menuRef} className="pf-u-w-100 chr-c-page__services-nav-dropdown-menu" data-testid="chr-c__find-app-service">
        <Backdrop>
          <Panel variant="raised" className="pf-u-p-0 chr-c-panel-services-nav">
            <PanelMain>
              <Sidebar>
                <SidebarPanel className="pf-l-flex pf-u-flex-direction-column">
                  <FlexItem className="chr-l-flex__item-browse-all-services pf-u-w-100 pf-u-p-md pf-u-mt-sm-on-md" order={{ default: '1', md: '2' }}>
                    <TextContent className="pf-u-text-align-center-on-md pf-u-pl-sm pf-u-pl-0-on-md">
                      <Text component={TextVariants.p}>
                        <ChromeLink href="/allservices">
                          <Icon className="pf-u-mr-sm" isInline>
                            <BookOpenIcon />
                          </Icon>
                          Browse all services
                        </ChromeLink>
                      </Text>
                    </TextContent>
                  </FlexItem>
                  <FlexItem order={{ default: '2', md: '1' }} className="chr-l-flex__item-tabs pf-u-w-100">
                    <AllServicesTabs
                      activeTabKey={activeTabKey}
                      handleTabClick={handleTabClick}
                      isExpanded={isExpanded}
                      onToggle={onToggle}
                      linkSections={linkSections}
                      tabContentRef={tabContentRef}
                      onTabClick={onTabClick}
                      activeTabTitle={activeTabKey === FAVORITE_TAB_ID ? 'Favorites' : selectedService.title}
                    />
                  </FlexItem>
                </SidebarPanel>
                <SidebarContent>
                  <Card isPlain>
                    <CardHeader className="pf-u-pr-xs pf-u-pr-md-on-md">
                      <Title headingLevel="h2">{activeTabKey === FAVORITE_TAB_ID ? 'Favorites' : selectedService.title}</Title>
                      <CardActions>
                        <Button variant="plain" aria-label="Close menu" onClick={() => setIsOpen(!isOpen)}>
                          <TimesIcon />
                        </Button>
                      </CardActions>
                    </CardHeader>
                    <CardBody>
                      <TabContent eventKey={activeTabKey} id={TAB_CONTENT_ID} ref={tabContentRef} aria-label={selectedService.description}>
                        {activeTabKey === FAVORITE_TAB_ID ? (
                          <Fragment>
                            <QuickAccess />
                            <FavoriteServicesGallery favoritedServices={favoritedServices} />
                          </Fragment>
                        ) : (
                          <AllServicesGallery selectedService={selectedService} />
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
    </AllServicesDropdownContext.Provider>
  );
};

export default AllServicesMenu;

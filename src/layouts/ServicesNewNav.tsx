import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  Dropdown,
  DropdownToggle,
  Gallery,
  Icon,
  Panel,
  PanelMain,
  Sidebar,
  Split,
  SplitItem,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core';
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
import useAllServices from '../hooks/useAllServices';
import AllServicesIcons from '../components/AllServices/AllServicesIcons';
import type { AllServicesGroup, AllServicesLink, AllServicesSection as AllServicesSectionType } from '../components/AllServices/allServicesLinks';
import { useLocation, useNavigate } from 'react-router-dom';
import { CaretDownIcon } from '@patternfly/react-icons';
import useAppFilter from '../components/AppFilter/useAppFilter';
import './ServicesNewNav.scss';
import { bundleMapping } from '../hooks/useBundle';

export type ServicesNewNavDropdownProps = {
  isLoaded: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  filterValue: string;
  setFilterValue: (filterValue?: string) => void;
};

const ServicesNewNavDropdown = ({ isLoaded, setIsOpen, isOpen }: ServicesNewNavDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const { linkSections } = useAllServices();
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(12);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [selectedService, setSelectedService] = React.useState<AllServicesSectionType>(linkSections[0]);
  const navigate = useNavigate();

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

  const navigateToLink = (link: AllServicesLink | AllServicesGroup) => {
    const serviceLink = link as AllServicesLink;
    if (serviceLink.href) {
      navigate(serviceLink.href);
    }
  };

  const getBundle = (link: AllServicesLink) => {
    if (link.href) {
      return bundleMapping[link.href.split('/')[1]];
    }
  };

  const contentRef1 = React.createRef<HTMLElement>();

  return (
    <Dropdown
      className="pf-m-full-height"
      toggle={
        <DropdownToggle
          id="toggle-id"
          onToggle={(_isOpen, event) => {
            if (!dropdownRef.current?.contains(event.target)) {
              setIsOpen(!isOpen);
            }
          }}
          toggleIndicator={CaretDownIcon}
        >
          Services
        </DropdownToggle>
      }
      isOpen={isOpen}
      ouiaId="App Filter"
    >
      {ReactDOM.createPortal(
        <div ref={dropdownRef} className="pf-c-dropdown chr-c-page__services-nav-dropdown-menu" data-testid="chr-c__find-app-service">
          <Panel variant="raised" className="pf-c-dropdown__menu pf-u-p-0 pf-u-w-100 chr-c-panel-services-nav ">
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
                        key={index}
                        eventKey={index}
                        title={<TabTitleText>{section.title}</TabTitleText>}
                        tabContentId="refTab1Section"
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
                      <TabContent eventKey={activeTabKey} id="refTab1Section" ref={contentRef1} aria-label={selectedService.description}>
                        <Gallery hasGutter>
                          {selectedService.links.map((link) => (
                            <Card key={link.title} isFlat isSelectableRaised onClick={() => navigateToLink(link)}>
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
                          ))}
                        </Gallery>
                      </TabContent>
                    </CardBody>
                  </Card>
                </SidebarContent>
              </Sidebar>
            </PanelMain>
          </Panel>
        </div>,
        document.body
      )}
    </Dropdown>
  );
};

export type ServicesNewNavProps = {
  Footer?: React.ReactNode;
};

const ServicesNewNav = () => {
  const { isLoaded, isOpen, setIsOpen, filterValue, setFilterValue } = useAppFilter();
  return (
    <React.Fragment>
      <ServicesNewNavDropdown isLoaded={isLoaded} setIsOpen={setIsOpen} isOpen={isOpen} filterValue={filterValue} setFilterValue={setFilterValue} />
    </React.Fragment>
  );
};

export default ServicesNewNav;

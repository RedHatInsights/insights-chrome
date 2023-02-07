import React, { useEffect, useState } from 'react';
import { Nav, NavList, PageContextConsumer, Split, SplitItem } from '@patternfly/react-core';
import { isBeta, isFedRamp } from '../../utils/common';
import './LandingNav.scss';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { loadNavigationLandingPage } from '../../redux/actions';
import NavLoader from '../Navigation/Loader';
import ChromeNavItemFactory from '../Navigation/ChromeNavItemFactory';
import NavContext from '../Navigation/navContext';
import componentMapper from '../Navigation/componentMapper';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import { ReduxState } from '../../redux/store';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardActions,
  CardTitle,
  Gallery,
  Tabs,
  Tab,
  TabContent,
  TabTitleText,
  Title,
  Panel,
  PanelMain,
  Sidebar,
  SidebarContent,
  SidebarPanel
} from "@patternfly/react-core";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import ShoppingCartIcon from '@patternfly/react-icons/dist/js/icons/shopping-cart-icon';
import useAllServices from '../../hooks/useAllServices';
import AllServicesIcons from '../AllServices/AllServicesIcons';

const LandingNav = () => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const [elementReady, setElementReady] = useState(false);
  const showNav = useSelector(({ chrome: { user } }: ReduxState) => !!user);
  const schema = useSelector(
    ({
      chrome: {
        navigation: { landingPage },
      },
    }: ReduxState) => landingPage
  );

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

  const { linkSections, error, ready, filterValue, setFilterValue } = useAllServices();

  const convertTitleIcon = (icon: keyof typeof AllServicesIcons) => {
    const TitleIcon = AllServicesIcons[icon]
    return <TitleIcon />
  }

  const contentRef1 = React.createRef<HTMLElement>();
  const contentRef2 = React.createRef<HTMLElement>();
  const contentRef3 = React.createRef<HTMLElement>();

  return (
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
  );
};

export default LandingNav;

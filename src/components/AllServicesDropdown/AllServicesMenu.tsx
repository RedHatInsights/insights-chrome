import React, { Fragment } from 'react';
import { Backdrop } from '@patternfly/react-core/dist/dynamic/components/Backdrop';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Panel, PanelMain } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { Sidebar, SidebarContent, SidebarPanel } from '@patternfly/react-core/dist/dynamic/components/Sidebar';
import { Split, SplitItem } from '@patternfly/react-core/dist/dynamic/layouts/Split';
import { TabContent } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';
import { useAtomValue } from 'jotai';
import classNames from 'classnames';

import type { AllServicesSection } from '../AllServices/allServicesLinks';
import FavoriteServicesGallery from '../FavoriteServices/ServicesGallery';
import AllServicesTabs from './AllServicesTabs';
import AllServicesGallery from './AllServicesGallery';
import { ServiceTileProps } from '../FavoriteServices/ServiceTile';
import { AllServicesDropdownContext, FAVORITE_TAB_ID, TAB_CONTENT_ID } from './common';
import { hidePreviewBannerAtom, layoutBannerHiddenAtom } from '../../state/atoms/releaseAtom';
import TimesIcon from '@patternfly/react-icons/dist/dynamic/icons/times-icon';

export type AllServicesMenuProps = {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement>;
  linkSections: AllServicesSection[];
  favoritedServices: ServiceTileProps[];
};

const AllServicesMenu = ({ setIsOpen, isOpen, menuRef, linkSections, favoritedServices }: AllServicesMenuProps) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(FAVORITE_TAB_ID);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [selectedService, setSelectedService] = React.useState<AllServicesSection>(linkSections[0]);
  const hideBanner = useAtomValue(hidePreviewBannerAtom);
  const layoutHidden = useAtomValue(layoutBannerHiddenAtom);

  // Toggle currently active tab
  const handleTabClick = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  const handleClickOutside = (event: React.MouseEvent<any>) => {
    if (isOpen && panelRef.current && !panelRef.current?.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  const onTabClick = (section: AllServicesSection, index: number | string) => {
    setSelectedService(section);
    setActiveTabKey(index);
    setIsExpanded(false);
  };

  const onToggle = (_e: React.MouseEvent<any>, isExpanded: boolean) => {
    setIsExpanded(isExpanded);
  };

  const tabContentRef = React.createRef<HTMLElement>();

  const panelRef = React.useRef<HTMLDivElement>(null);

  return (
    <AllServicesDropdownContext.Provider
      value={{
        onLinkClick() {
          // close modal on any link click
          setIsOpen(false);
        },
      }}
    >
      <div
        ref={menuRef}
        className={classNames('pf-v6-u-w-100 chr-c-page__services-nav-dropdown-menu', {
          'preview-offset': !hideBanner && !layoutHidden,
        })}
        data-testid="chr-c__find-app-service"
        onClick={handleClickOutside}
      >
        <Backdrop>
          <Panel variant="raised" isGlass className="pf-v6-u-p-0 chr-c-panel-services-nav" ref={panelRef}>
            <PanelMain>
              <Sidebar hasBorder>
                <SidebarPanel backgroundVariant="secondary" tabIndex={0} role="region" aria-label="Service categories">
                  <AllServicesTabs
                    activeTabKey={activeTabKey}
                    handleTabClick={handleTabClick}
                    isExpanded={isExpanded}
                    onToggle={onToggle}
                    linkSections={linkSections}
                    tabContentRef={tabContentRef}
                    onTabClick={onTabClick}
                    activeTabTitle={activeTabKey === FAVORITE_TAB_ID ? 'Favorites' : selectedService.title}
                    setIsExpanded={setIsExpanded}
                  />
                </SidebarPanel>
                <SidebarContent>
                  <Split className="pf-v6-u-pl-lg pf-v6-u-pr-md pf-v6-u-py-md pf-v6-u-align-items-center">
                    <SplitItem isFilled>
                      <Title headingLevel="h3">
                        {activeTabKey === FAVORITE_TAB_ID ? (
                          <>
                            <StarIcon /> My Favorite services
                          </>
                        ) : (
                          <>{selectedService.title}</>
                        )}
                      </Title>
                    </SplitItem>
                    <SplitItem>
                      <Button className="pf-v6-u-mr-sm" icon={<TimesIcon />} variant="plain" aria-label="Close menu" onClick={() => setIsOpen(!isOpen)} />
                    </SplitItem>
                  </Split>
                  <Divider />
                  <TabContent
                    eventKey={activeTabKey}
                    id={TAB_CONTENT_ID}
                    ref={tabContentRef}
                    aria-label={activeTabKey === FAVORITE_TAB_ID ? 'My Favorite services' : selectedService?.description}
                  >
                    {activeTabKey === FAVORITE_TAB_ID ? (
                      <Fragment>
                        <FavoriteServicesGallery favoritedServices={favoritedServices} />
                      </Fragment>
                    ) : (
                      <AllServicesGallery selectedService={selectedService} />
                    )}
                  </TabContent>
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

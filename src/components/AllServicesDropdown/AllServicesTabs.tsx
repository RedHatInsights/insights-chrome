import React from 'react';
import { Icon, Tab, TabTitleText, Tabs, TabsProps } from '@patternfly/react-core';
import StarIcon from '@patternfly/react-icons/dist/js/icons/star-icon';

import { FAVORITE_TAB_ID, TAB_CONTENT_ID } from './common';
import type { AllServicesSection as AllServicesSectionType } from '../AllServices/allServicesLinks';

export type AllServicesTabsProps = {
  activeTabKey: string | number;
  handleTabClick: TabsProps['onSelect'];
  isExpanded: boolean;
  onToggle: TabsProps['onToggle'];
  linkSections: AllServicesSectionType[];
  tabContentRef: React.RefObject<HTMLElement>;
  onTabClick: (section: AllServicesSectionType, index: number) => void;
};

const AllServicesTabs = ({ activeTabKey, handleTabClick, isExpanded, onToggle, linkSections, tabContentRef, onTabClick }: AllServicesTabsProps) => {
  return (
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
          tabContentRef={tabContentRef}
          onClick={() => onTabClick(section, index)}
        />
      ))}
    </Tabs>
  );
};

export default AllServicesTabs;

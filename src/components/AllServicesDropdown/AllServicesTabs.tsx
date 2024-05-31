import React, { useEffect, useRef } from 'react';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Tab, TabProps, TabTitleText, Tabs, TabsProps } from '@patternfly/react-core/dist/dynamic/components/Tabs';

import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';

import { FAVORITE_TAB_ID, TAB_CONTENT_ID } from './common';
import type { AllServicesSection as AllServicesSectionType } from '../AllServices/allServicesLinks';
import { isBeta } from '../../utils/common';
import { Text, TextVariants } from '@patternfly/react-core/dist/esm/components/Text';
import ChromeLink from '../ChromeLink';
import { Button } from '@patternfly/react-core';

export type AllServicesTabsProps = {
  activeTabKey: string | number;
  handleTabClick: TabsProps['onSelect'];
  isExpanded: boolean;
  onToggle: TabsProps['onToggle'];
  linkSections: AllServicesSectionType[];
  tabContentRef: React.RefObject<HTMLElement>;
  onTabClick: (section: AllServicesSectionType, index: number) => void;
  activeTabTitle: string;
};

type TabWrapper = Omit<TabProps, 'onMouseLeave' | 'onMouseEnter' | 'ref'>;

const TabWrapper = (props: TabWrapper) => {
  const tabRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const stopHoverEffect = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
  };

  const handleMouseEnter = () => {
    stopHoverEffect();
    const timeout = setTimeout(() => {
      // should be available only in preview
      // use refs to supply the required tab events
      isBeta() && tabRef.current?.click();
    }, 300);
    hoverTimer.current = timeout;
  };

  useEffect(() => {
    return () => {
      stopHoverEffect();
    };
  }, []);
  return <Tab {...props} ref={tabRef} onMouseLeave={stopHoverEffect} onMouseEnter={handleMouseEnter} />;
};

const AllServicesTabs = ({
  activeTabKey,
  handleTabClick,
  isExpanded,
  onToggle,
  linkSections,
  tabContentRef,
  onTabClick,
  activeTabTitle,
}: AllServicesTabsProps) => {
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
      toggleText={activeTabTitle}
      role="region"
      className="pf-v5-u-p-md pf-v5-u-pr-0"
      ouiaId={'all-services-tabs'}
    >
      <Text className="pf-v5-u-p-md pf-v5-u-pr-0" component={TextVariants.small}>
        Platform
      </Text>
      <ChromeLink href="/ansible/ansible-dashboard">
        <Button variant="link" component="a">
          Red Hat Ansible Platform
        </Button>
      </ChromeLink>
      <ChromeLink href="/insights/dashboard#SIDs=&tags=">
        <Button variant="link" component="a">
          Red Hat Enterprise Linux
        </Button>
      </ChromeLink>
      <ChromeLink href="/openshift/overview">
        <Button variant="link" component="a">
          Red Hat OpenShift
        </Button>
      </ChromeLink>
      <TabWrapper
        ouiaId="AllServices-favorites-Tab"
        onClick={(e) => {
          handleTabClick?.(e, FAVORITE_TAB_ID);
        }}
        eventKey={FAVORITE_TAB_ID}
        title={
          <TabTitleText>
            Favorites
            <Icon className="chr-c-icon-service-tab pf-v5-u-ml-sm" status="warning" isInline>
              <StarIcon />
            </Icon>
          </TabTitleText>
        }
      />
      <>
        <Text className="pf-v5-u-p-md pf-v5-u-pr-0" component={TextVariants.small}>
          Solutions{' '}
          <ChromeLink href="/allservices">
            <Button variant="link" component="a">
              View all
            </Button>
          </ChromeLink>
        </Text>
        {/* The tabs children type is busted and does not accept array. Hence the fragment wrapper */}
        {linkSections.map((section, index) => (
          <TabWrapper
            ouiaId={`AllServices-${section.id}-Tab`}
            key={index}
            eventKey={index}
            title={<TabTitleText>{section.title}</TabTitleText>}
            tabContentId={TAB_CONTENT_ID}
            tabContentRef={tabContentRef}
            onClick={() => onTabClick(section, index)}
          />
        ))}
      </>
    </Tabs>
  );
};

export default AllServicesTabs;

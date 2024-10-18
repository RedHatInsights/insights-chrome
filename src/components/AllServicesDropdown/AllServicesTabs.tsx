import React, { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Tab, TabProps, TabTitleText, Tabs, TabsProps } from '@patternfly/react-core/dist/dynamic/components/Tabs';

import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';

import { FAVORITE_TAB_ID, TAB_CONTENT_ID } from './common';
import type { AllServicesSection as AllServicesSectionType } from '../AllServices/allServicesLinks';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import ChromeLink from '../ChromeLink';
import './AllServicesTabs.scss';
import PlatformServiceslinks from './PlatformServicesLinks';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';

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
  const isPreview = useAtomValue(isPreviewAtom);
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
      isPreview && tabRef.current?.click();
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
      className="pf-v6-u-p-md pf-v6-u-pr-0 pf-v6-u-pl-0-on-md"
      ouiaId={'all-services-tabs'}
    >
      <Content className="pf-v6-u-pl-lg pf-v6-u-pr-0 pf-v6-u-pt-0 pf-v6-u-pb-sm" component={ContentVariants.p}>
        Platform
      </Content>
      <Divider className="pf-v6-u-pb-md" />
      <PlatformServiceslinks />
      <>
        <Content className="pf-v6-u-pl-lg pf-v6-u-pr-0 pf-v6-u-pt-lg pf-v6-u-pb-sm" component={ContentVariants.p}>
          Solutions{' '}
          <ChromeLink href="/allservices" className="pf-v6-u-font-size-sm pf-v6-u-p-md" data-ouia-component-id="View all link">
            View all
          </ChromeLink>
        </Content>
        <Divider className="pf-v6-u-pb-sm" />
        <TabWrapper
          ouiaId="AllServices-favorites-Tab"
          onClick={(e) => {
            handleTabClick?.(e, FAVORITE_TAB_ID);
          }}
          eventKey={FAVORITE_TAB_ID}
          title={
            <TabTitleText className="pf-v6-u-pl-sm">
              Favorites
              <Icon className="chr-c-icon-service-tab pf-v6-u-ml-sm" status="warning" isInline>
                <StarIcon />
              </Icon>
            </TabTitleText>
          }
        />
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
            className="pf-v6-u-pl-sm"
          />
        ))}
      </>
    </Tabs>
  );
};

export default AllServicesTabs;

import React, { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Tab, TabProps, TabTitleText, Tabs, TabsProps } from '@patternfly/react-core/dist/dynamic/components/Tabs';

import AngleRightIcon from '@patternfly/react-icons/dist/dynamic/icons/angle-right-icon';
import StarIcon from '@patternfly/react-icons/dist/dynamic/icons/star-icon';

import { FAVORITE_TAB_ID, TAB_CONTENT_ID } from './common';
import type { AllServicesSection as AllServicesSectionType } from '../AllServices/allServicesLinks';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Link } from 'react-router-dom';
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
  onTabClick: (section: AllServicesSectionType, index: number | string) => void;
  activeTabTitle: string;
  setIsExpanded: (isExpanded: boolean) => void;
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
      if (isPreview) {
        tabRef.current?.click();
      }
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
  setIsExpanded,
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
      <Content className="pf-v6-u-pl-lg pf-v6-u-pr-0 pf-v6-u-pt-sm pf-v6-u-mb-md" component={ContentVariants.small}>
        Platforms
      </Content>
      <PlatformServiceslinks />
      <>
        <Divider className="pf-v6-u-mt-md" />
        <Content className="pf-v6-u-pl-lg pf-v6-u-pr-0 pf-v6-u-pt-lg pf-v6-u-mb-sm pf-v6-u-pb-xs" component={ContentVariants.small}>
          Services{' '}
          <Link
            to="/allservices"
            className="pf-v6-u-font-size-xs pf-v6-u-p-md pf-v5-u-pl-sm chr-m-plain"
            data-ouia-component-id="View all link"
            onClick={() => {
              setIsExpanded(false);
            }}
          >
            View all services
          </Link>
        </Content>
        <TabWrapper
          ouiaId="AllServices-favorites-Tab"
          onClick={(e) => {
            handleTabClick?.(e, FAVORITE_TAB_ID);
          }}
          eventKey={FAVORITE_TAB_ID}
          title={
            <TabTitleText className="pf-v6-u-text-color-regular">
              My Favorite services
              <Icon className="chr-c-icon-service-tab pf-v6-u-ml-sm" status="warning" isInline>
                <StarIcon />
              </Icon>
              <Icon className="pf-v6-u-float-inline-end pf-v6-u-mt-xs">
                <AngleRightIcon />
              </Icon>
            </TabTitleText>
          }
          className="pf-v6-u-pl-md"
        />
        {/* The tabs children type is busted and does not accept array. Hence the fragment wrapper */}
        {linkSections.map((section, index) => {
          const eventKey = `${index}-${section.id}`;
          return (
            <TabWrapper
              ouiaId={`AllServices-${section.id}-Tab`}
              key={eventKey}
              eventKey={eventKey}
              title={
                <TabTitleText>
                  {section.title}
                  <Icon className="pf-v6-u-float-inline-end pf-v6-u-mt-xs">
                    <AngleRightIcon />
                  </Icon>
                </TabTitleText>
              }
              tabContentId={TAB_CONTENT_ID}
              tabContentRef={tabContentRef}
              onClick={() => onTabClick(section, eventKey)}
            />
          );
        })}
      </>
    </Tabs>
  );
};

export default AllServicesTabs;

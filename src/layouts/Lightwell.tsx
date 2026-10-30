import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScalprumComponent } from '@scalprum/react-core';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Page } from 'pf-6-next/dist/dynamic/components/Page';
import { ToolbarGroup } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import { useAtom, useSetAtom } from 'jotai';
import { useFlag, useFlagsStatus, useUnleashClient } from '@unleash/proxy-client-react';
import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import LoadingFallback from '../utils/loading-fallback';
import ErrorComponent from '../components/ErrorComponents/DefaultErrorComponent';
import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import { notificationDrawerExpandedAtom } from '../state/atoms/notificationDrawerAtom';
import { layoutBannerHiddenAtom, layoutLightwellHeaderAtom } from '../state/atoms/releaseAtom';
import DrawerPanel from '../components/NotificationsDrawer/DrawerPanelContent';
import useLightwellRouteSetup from '../hooks/useLightwellRouteSetup';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import LightwellNavigation from '../components/Navigation/LightwellNavigation';
import { withHorizontalSubnav } from './layoutUtils';
import './Lightwell.scss';

const LIGHTWELL_EXPERIENCE_FLAG = 'platform.chrome.lightwell-experience';

const CONTENT_SOURCES_REMOTE = {
  scope: 'contentSources',
  module: './LightwellApp',
  appId: 'contentSources',
} as const;

const LIGHTWELL_EXPERIENCE_REMOTE = {
  scope: 'lightwellExperience',
  module: './RootApp',
  appId: 'lightwellExperience',
} as const;

// The SDK stores the first error it sees, including metrics failures, until recovery clears it.
const isMetricsError = (error: unknown): boolean => typeof error === 'object' && error !== null && 'type' in error && error.type === 'metrics';

export type LightwellProps = {
  Footer?: React.ReactNode;
};

// TODO: Temporary layout for content-sources-frontend authed experience (RHCLOUD-48921). Revisit for a longer-term approach.
const Lightwell = ({ Footer }: LightwellProps) => {
  useLightwellRouteSetup();
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const [isNotificationsDrawerExpanded, setIsNotificationsDrawerExpanded] = useAtom(notificationDrawerExpandedAtom);
  const setLayoutBannerHidden = useSetAtom(layoutBannerHiddenAtom);
  const setLayoutLightwellHeader = useSetAtom(layoutLightwellHeaderAtom);
  const setActiveModule = useSetAtom(activeModuleAtom);
  const isLightwellExperienceEnabled = useFlag(LIGHTWELL_EXPERIENCE_FLAG);
  const { flagsReady } = useFlagsStatus();
  const unleashClient = useUnleashClient();
  const [flagFetchFailed, setFlagFetchFailed] = useState(false);
  const hasResolvedFlags = useRef(false);
  if (!hasResolvedFlags.current && (flagsReady || flagFetchFailed)) {
    hasResolvedFlags.current = true;
  }
  const flagsResolved = hasResolvedFlags.current;
  const remote = flagsReady && isLightwellExperienceEnabled ? LIGHTWELL_EXPERIENCE_REMOTE : CONTENT_SOURCES_REMOTE;

  useLayoutEffect(() => {
    setLayoutBannerHidden(true);
    setLayoutLightwellHeader(true);
    return () => {
      setLayoutBannerHidden(false);
      setLayoutLightwellHeader(false);
    };
  }, [setLayoutBannerHidden, setLayoutLightwellHeader]);

  useEffect(() => {
    const markFlagFetchFailed = (error?: unknown) => {
      if (!isMetricsError(error)) {
        setFlagFetchFailed(true);
      }
    };
    const existingError = unleashClient.getError();
    if (existingError) {
      markFlagFetchFailed(existingError);
    }
    unleashClient.on('error', markFlagFetchFailed);
    return () => {
      unleashClient.off('error', markFlagFetchFailed);
    };
  }, [unleashClient]);

  useEffect(() => {
    if (!flagsResolved) {
      return;
    }
    setActiveModule(remote.scope);
    return () => {
      setActiveModule(undefined);
    };
  }, [flagsResolved, remote.scope, setActiveModule]);

  const isNotificationsEnabled = useFlag('platform.chrome.notifications-drawer');
  const isHelpPanelEnabled = useFlag('platform.chrome.help-panel');
  const isDrawerEnabled = isNotificationsEnabled || isHelpPanelEnabled;

  const focusDrawer = () => {
    if (drawerPanelRef.current === null) {
      return;
    }
    const tabbableElement = drawerPanelRef.current?.querySelector('[aria-label="Close"], a, button') as HTMLAnchorElement | HTMLButtonElement;
    if (tabbableElement) {
      tabbableElement.focus();
    }
  };

  const toggleDrawer = () => {
    setIsNotificationsDrawerExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (isNotificationsDrawerExpanded && drawerPanelRef.current !== null) {
      focusDrawer();
    }
  }, [isNotificationsDrawerExpanded]);

  return (
    <div id="chrome-app-render-root" className="chr-m-footer-after-page">
      <Page
        data-testid="lightwell-page"
        className="chr-c-page--lightwell"
        isPlain
        sidebar={null}
        onPageResize={null}
        masthead={withHorizontalSubnav(
          <Masthead className="chr-c-masthead" display={{ default: 'inline' }}>
            <Header
              breadcrumbsProps={{ hideNav: true }}
              toolbarConfig={{
                hideNotifications: true,
                hideHelp: true,
                settingsGroups: {
                  showColorScheme: true,
                },
                userMenu: {
                  showLogout: true,
                },
              }}
            />
          </Masthead>,
          <LightwellNavigation />
        )}
        {...(isDrawerEnabled && {
          onNotificationDrawerExpand: focusDrawer,
          notificationDrawer: <DrawerPanel ref={drawerPanelRef} toggleDrawer={toggleDrawer} />,
          isNotificationDrawerExpanded: isNotificationsDrawerExpanded,
        })}
      >
        <ToolbarGroup className="chr-c-breadcrumbs__group">
          <Breadcrumbs />
        </ToolbarGroup>
        <RedirectBanner />
        {flagsResolved ? (
          <ScalprumComponent
            key={remote.scope}
            scope={remote.scope}
            module={remote.module}
            appId={remote.appId}
            ErrorComponent={<ErrorComponent />}
            fallback={LoadingFallback}
          />
        ) : (
          LoadingFallback
        )}
      </Page>
      {Footer}
    </div>
  );
};

export default Lightwell;

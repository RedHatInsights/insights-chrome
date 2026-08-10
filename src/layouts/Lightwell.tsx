import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { ScalprumComponent } from '@scalprum/react-core';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Page } from '@patternfly/react-core/dist/dynamic/components/Page';
import { ToolbarGroup } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import { useAtom, useSetAtom } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
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

  useLayoutEffect(() => {
    setLayoutBannerHidden(true);
    setLayoutLightwellHeader(true);
    return () => {
      setLayoutBannerHidden(false);
      setLayoutLightwellHeader(false);
    };
  }, [setLayoutBannerHidden, setLayoutLightwellHeader]);

  useEffect(() => {
    setActiveModule('contentSources');
    return () => {
      setActiveModule(undefined);
    };
  }, [setActiveModule]);

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
    <div id="chrome-app-render-root">
      <Page
        onPageResize={null}
        masthead={
          <Masthead className="chr-c-masthead" display={{ sm: 'stack', '2xl': 'inline' }}>
            <Header
              breadcrumbsProps={{ hideNav: true }}
              toolbarConfig={{
                hideNotifications: true,
                hideHelp: true,
                settingsGroups: {
                  hidePreview: true,
                  hideSettingsGroup: true,
                  hideIAM: true,
                  hideTheme: true,
                  hideContrastMode: true,
                },
              }}
            />
          </Masthead>
        }
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
        <ScalprumComponent
          scope="contentSources"
          module="./LightwellApp"
          appId="contentSources"
          ErrorComponent={<ErrorComponent />}
          fallback={LoadingFallback}
        />
        {Footer}
      </Page>
    </div>
  );
};

export default Lightwell;

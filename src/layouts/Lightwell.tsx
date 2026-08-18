import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { ScalprumComponent } from '@scalprum/react-core';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Nav, NavItem, NavList } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { Page } from '@patternfly/react-core/dist/dynamic/components/Page';
import { ToolbarGroup } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import { useAtom, useSetAtom } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { NavLink, useLocation } from 'react-router-dom';
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
import { LIGHTWELL_PATH } from '../utils/common';

export type LightwellProps = {
  Footer?: React.ReactNode;
};

// TODO: RHCLOUD-50417 — Temporary hardcoded horizontal navigation for Lightwell.
// Remove once the generic flat navigation feature is built.
const LIGHTWELL_NAV_ITEMS = [
  { label: 'Repositories', path: LIGHTWELL_PATH },
  { label: 'Lens', path: `${LIGHTWELL_PATH}/lens` },
  { label: 'Beacon', path: `${LIGHTWELL_PATH}/beacon` },
] as const;

/**
 * Determine which Lightwell nav item is active based on pathname.
 * Checks specific sub-routes first; falls back to Repositories (root).
 */
const getActiveLightwellNav = (pathname: string): string => {
  if (pathname === `${LIGHTWELL_PATH}/lens` || pathname.startsWith(`${LIGHTWELL_PATH}/lens/`)) return `${LIGHTWELL_PATH}/lens`;
  if (pathname === `${LIGHTWELL_PATH}/beacon` || pathname.startsWith(`${LIGHTWELL_PATH}/beacon/`)) return `${LIGHTWELL_PATH}/beacon`;
  return LIGHTWELL_PATH;
};

// TODO: Temporary layout for content-sources-frontend authed experience (RHCLOUD-48921). Revisit for a longer-term approach.
const Lightwell = ({ Footer }: LightwellProps) => {
  useLightwellRouteSetup();
  const { pathname } = useLocation();
  const activeNav = getActiveLightwellNav(pathname);
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
                  showColorScheme: true,
                },
                userMenu: {
                  showLogout: true,
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
        {/* TODO: RHCLOUD-50417 — Temporary Lightwell-specific horizontal subnav. Remove when generic flat nav is available. */}
        <Nav variant="horizontal-subnav" aria-label="Lightwell navigation">
          <NavList>
            {LIGHTWELL_NAV_ITEMS.map(({ label, path }) => (
              <NavItem
                key={path}
                isActive={activeNav === path}
                to={path}
                component={({ className: navClassName, children, ...rest }) => (
                  <NavLink to={path} className={navClassName} {...rest}>
                    {children}
                  </NavLink>
                )}
              >
                {label}
              </NavItem>
            ))}
          </NavList>
        </Nav>
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

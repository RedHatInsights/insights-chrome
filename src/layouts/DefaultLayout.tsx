import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import GlobalFilter from '../components/GlobalFilter/GlobalFilter';
import { useScalprum } from '@scalprum/react-core';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Page } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSidebar } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSidebarBody } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Header } from '../components/Header/Header';
import Cookie from 'js-cookie';
import isEqual from 'lodash/isEqual';
import ChromeRoutes from '../components/Routes/Routes';
import useOuiaTags from '../utils/useOuiaTags';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import { useAtom } from 'jotai';

import { useIntl } from 'react-intl';
import messages from '../locales/Messages';
import { CROSS_ACCESS_ACCOUNT_NUMBER } from '../utils/consts';

import '../components/Navigation/Navigation.scss';
import './DefaultLayout.scss';
import useNavigation from '../utils/useNavigation';
import { NavigationProps } from '../components/Navigation';
import { getUrl } from '../hooks/useBundle';
import { useFlag } from '@unleash/proxy-client-react';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import VirtualAssistant from '../components/Routes/VirtualAssistant';
import { notificationDrawerExpandedAtom } from '../state/atoms/notificationDrawerAtom';
import { ITLess } from '../utils/common';
import DrawerPanel from '../components/NotificationsDrawer/DrawerPanelContent';

type ShieldedRootProps = {
  hideNav?: boolean;
  initialized?: boolean;
  Sidebar?: React.FC<NavigationProps>;
  Footer?: React.ReactNode;
};

type DefaultLayoutProps = {
  hasBanner: boolean;
  selectedAccountNumber?: string;
  hideNav: boolean;
  isNavOpen: boolean;
  setIsNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  Sidebar?: React.FC<NavigationProps>;
  Footer?: React.ReactNode;
};

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ hasBanner, selectedAccountNumber, hideNav, isNavOpen, setIsNavOpen, Sidebar, Footer }) => {
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (drawerPanelRef.current !== null) {
      focusDrawer();
    }
  }, []);
  const focusDrawer = () => {
    if (drawerPanelRef.current === null) {
      return;
    }
    const tabbableElement = drawerPanelRef.current?.querySelector('[aria-label="Close"], a, button') as HTMLAnchorElement | HTMLButtonElement;
    console.log(tabbableElement);
    if (tabbableElement) {
      tabbableElement.focus();
    }
  };
  const toggleDrawer = () => {
    setIsNotificationsDrawerExpanded((prev) => !prev);
  };
  const intl = useIntl();
  const { loaded, schema, noNav } = useNavigation();
  const [isNotificationsDrawerExpanded, setIsNotificationsDrawerExpanded] = useAtom(notificationDrawerExpandedAtom);
  const isNotificationsEnabled = useFlag('platform.chrome.notifications-drawer');

  return (
    <Page
      className={
        (classnames('chr-c-page', { 'chr-c-page__hasBanner': hasBanner, 'chr-c-page__account-banner': selectedAccountNumber }),
        'pf-c-page') /** we have to add the legacy styling to allow v4 page layout sub components to be able to inherit legacy styling */
      }
      onPageResize={null} // required to disable PF resize observer that causes re-rendering issue
      header={
        <Masthead className="chr-c-masthead pf-v5-u-p-0" display={{ sm: 'stack', '2xl': 'inline' }}>
          <Header
            breadcrumbsProps={{
              isNavOpen,
              setIsNavOpen,
              hideNav,
            }}
          />
        </Masthead>
      }
      {...(isNotificationsEnabled && {
        onNotificationDrawerExpand: focusDrawer,
        notificationDrawer: <DrawerPanel ref={drawerPanelRef} toggleDrawer={toggleDrawer} />,
        isNotificationDrawerExpanded: isNotificationsDrawerExpanded,
      })}
      sidebar={
        (noNav || hideNav) && Sidebar
          ? undefined
          : Sidebar && (
              <PageSidebar isSidebarOpen={isNavOpen} id="chr-c-sidebar">
                <PageSidebarBody>
                  <Sidebar schema={schema} loaded={loaded} />
                </PageSidebarBody>
              </PageSidebar>
            )
      }
    >
      <div className={classnames('chr-render')}>
        <GlobalFilter key={getUrl('bundle')} />
        {selectedAccountNumber && (
          <div className="chr-viewing-as sentry-mask data-hj-suppress">
            {intl.formatMessage(messages.viewingAsAccount, { selectedAccountNumber })}
          </div>
        )}
        <RedirectBanner />
        {ITLess() ? null : <VirtualAssistant />}
        <ChromeRoutes routesProps={{ scopeClass: 'chr-scope__default-layout' }} />
        {Footer}
      </div>
    </Page>
  );
};

const ShieldedRoot = memo(
  ({ hideNav = false, initialized = false, Sidebar, Footer }: ShieldedRootProps) => {
    const [isMobileView, setIsMobileView] = useState(window.document.body.clientWidth < 1200);
    const [isNavOpen, setIsNavOpen] = useState(!isMobileView);
    /**
     * Required for event listener to access the variables
     */
    const mutableStateRef = useRef({
      isMobileView,
    });
    function navReziseListener() {
      const internalMobile = window.document.body.clientWidth < 1200;
      const { isMobileView } = mutableStateRef.current;
      if (!isMobileView && internalMobile) {
        setIsMobileView(true);
        setIsNavOpen(false);
        mutableStateRef.current = {
          isMobileView: true,
        };
      } else if (isMobileView && !internalMobile) {
        setIsMobileView(false);
        setIsNavOpen(true);
        mutableStateRef.current = {
          isMobileView: false,
        };
      }
    }

    useEffect(() => {
      window.addEventListener('resize', navReziseListener);
      return () => {
        window.removeEventListener('resize', navReziseListener);
      };
    }, []);

    if (!initialized) {
      return null;
    }

    const selectedAccountNumber = Cookie.get(CROSS_ACCESS_ACCOUNT_NUMBER);
    const hasBanner = false; // Update this later when we use feature flags

    return (
      <DefaultLayout
        setIsNavOpen={setIsNavOpen}
        hideNav={hideNav}
        isNavOpen={isNavOpen}
        hasBanner={hasBanner}
        selectedAccountNumber={selectedAccountNumber}
        Sidebar={Sidebar}
        Footer={Footer}
      />
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);

ShieldedRoot.displayName = 'ShieldedRoot';

export type RootAppProps = {
  Sidebar?: React.FC<NavigationProps>;
  Footer?: React.ReactNode;
};

const DefaultLayoutRoot = ({ Sidebar, Footer }: RootAppProps) => {
  const ouiaTags = useOuiaTags();
  const initialized = useScalprum(({ initialized }) => initialized);
  const { user } = useContext(ChromeAuthContext);
  const hideNav = !user || !Sidebar;

  return (
    <div id="chrome-app-render-root" {...ouiaTags}>
      <ShieldedRoot hideNav={hideNav} initialized={initialized} Sidebar={Sidebar} Footer={Footer} />
    </div>
  );
};

export default DefaultLayoutRoot;

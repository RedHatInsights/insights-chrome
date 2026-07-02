import React, { useEffect, useRef } from 'react';
import { ScalprumComponent } from '@scalprum/react-core';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Page } from '@patternfly/react-core/dist/dynamic/components/Page';
import { useAtom } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { Header } from '../components/Header/Header';
import RedirectBanner from '../components/Stratosphere/RedirectBanner';
import LoadingFallback from '../utils/loading-fallback';
import ErrorComponent from '../components/ErrorComponents/DefaultErrorComponent';
import { notificationDrawerExpandedAtom } from '../state/atoms/notificationDrawerAtom';
import DrawerPanel from '../components/NotificationsDrawer/DrawerPanelContent';
import useFeltTheme from '../hooks/useFeltTheme';

export type LightwellProps = {
  Footer?: React.ReactNode;
};

// TODO: Temporary layout for content-sources-frontend authed experience (RHCLOUD-48921). Revisit for a longer-term approach.
const Lightwell = ({ Footer }: LightwellProps) => {
  useFeltTheme();
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const [isNotificationsDrawerExpanded, setIsNotificationsDrawerExpanded] = useAtom(notificationDrawerExpandedAtom);

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
            <Header breadcrumbsProps={{ hideNav: true }} />
          </Masthead>
        }
        {...(isDrawerEnabled && {
          onNotificationDrawerExpand: focusDrawer,
          notificationDrawer: <DrawerPanel ref={drawerPanelRef} toggleDrawer={toggleDrawer} />,
          isNotificationDrawerExpanded: isNotificationsDrawerExpanded,
        })}
      >
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

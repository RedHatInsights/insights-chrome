import React, { useContext, useEffect, useState } from 'react';

import { NotificationDrawer } from '@patternfly/react-core/dist/dynamic/components/NotificationDrawer';

import ChromeAuthContext from '../../auth/ChromeAuthContext';
import InternalChromeContext from '../../utils/internalChromeContext';

import { getSharedScope } from '@scalprum/core';
import { useAtomValue, useSetAtom } from 'jotai';
import { notificationDrawerReadyAtom, notificationDrawerUnreadAtom } from '../../state/atoms/notificationDrawerAtom';

export type DrawerPanelProps = {
  panelRef: React.Ref<unknown>;
  toggleDrawer: () => void;
};
const NOTIF_DRAWER_MODULE = '@notif-module/drawer';

const DrawerPanelBase: React.FC<DrawerPanelProps> = ({ panelRef, toggleDrawer }) => {
  const auth = useContext(ChromeAuthContext);
  const isOrgAdmin = auth?.user?.identity?.user?.is_org_admin;
  const { getUserPermissions } = useContext(InternalChromeContext);
  const notificationProps = {
    isOrgAdmin: isOrgAdmin,
    getUserPermissions: getUserPermissions,
    panelRef: panelRef,
    toggleDrawer: toggleDrawer,
  };

  const [initialized, setInitialized] = useState(false);
  const { DrawerPanel, useNotificationsDrawer } = getSharedScope()[NOTIF_DRAWER_MODULE]['1.0.0'].get();
  const isNotificationsDrawerReady = useAtomValue(notificationDrawerReadyAtom);
  const { state, initialize, hasUnreadNotifications } = useNotificationsDrawer();
  const setUnreadNotifiations = useSetAtom(notificationDrawerUnreadAtom);

  useEffect(() => {
    if (!isNotificationsDrawerReady || initialized) return;
    getUserPermissions('notifications')
      .then((perms) => {
        initialize(true, perms);
        setUnreadNotifiations(hasUnreadNotifications());
      })
      .catch((err) => {
        console.error('Error fetching user notifications permissions while rendering drawer content', err);
      });
    setInitialized(true);
  }, [isNotificationsDrawerReady]);

  useEffect(() => {
    console.log(state, 'state');
    setUnreadNotifiations(hasUnreadNotifications());
  }, [state]);

  return (
    <NotificationDrawer ref={panelRef} {...notificationProps}>
      <DrawerPanel {...notificationProps} />
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef<unknown, Omit<DrawerPanelProps, 'panelRef'>>((props, innerRef) => {
  const DrawerPanelProvider = () => {
    const { DrawerContextProvider } = getSharedScope()[NOTIF_DRAWER_MODULE]['1.0.0'].get();

    return (
      <DrawerContextProvider>
        <DrawerPanelBase panelRef={innerRef} {...props} />
      </DrawerContextProvider>
    );
  };

  return <DrawerPanelProvider />;
});
DrawerPanel.displayName = 'DrawerPanel';

export default DrawerPanel;

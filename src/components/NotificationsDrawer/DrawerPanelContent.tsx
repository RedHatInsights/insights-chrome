import React, { useContext, useEffect, useState } from 'react';

import { NotificationDrawer } from '@patternfly/react-core/dist/dynamic/components/NotificationDrawer';

import ChromeAuthContext from '../../auth/ChromeAuthContext';
import InternalChromeContext from '../../utils/internalChromeContext';

import { getModule, getSharedScope } from '@scalprum/core';
import { useAtom, useAtomValue } from 'jotai';
import { notificationDrawerReadyAtom } from '../../state/atoms/notificationDrawerAtom';

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

  const isNotificationsDrawerReady = useAtomValue(notificationDrawerReadyAtom);

  useEffect(() => {
    if (!isNotificationsDrawerReady) return;
    console.log('DrawerPanelBase useEffect');
    console.log('getSharedScope', getSharedScope()[NOTIF_DRAWER_MODULE]);
    const { useNotificationsDrawer } = getSharedScope()[NOTIF_DRAWER_MODULE]['1.0.0'].get();
    const { state, initialize } = useNotificationsDrawer();
    // get the users permissions
    const perms = getUserPermissions('notifications');
    initialize(true, perms);
    console.log('state', state);
  }, [isNotificationsDrawerReady]);

  const { DrawerPanel } = getSharedScope()[NOTIF_DRAWER_MODULE]['1.0.0'].get();
  return (
    <NotificationDrawer ref={panelRef} {...notificationProps}>
      <DrawerPanel {...notificationProps} />
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef<unknown, Omit<DrawerPanelProps, 'panelRef'>>((props, innerRef) => {
  const [RegisterDrawerModule, setRegisterDrawerModule] = useState<React.FC | null>(null);
  const getNotificationsDrawer = async () => {
    try {
      const RegisterDrawerModule = await getModule('notifications', './RegisterDrawerModule');
      setRegisterDrawerModule(RegisterDrawerModule);
      setIsNotificationDrawerReady(true);
    } catch (error) {
      console.error('Failed to register notifications drawer module', error);
    }
  };
  useEffect(() => {
    getNotificationsDrawer();
  }, []);
  const [isNotificationsDrawerReady, setIsNotificationDrawerReady] = useAtom(notificationDrawerReadyAtom);

  const DrawerPanelProvider = () => {
    const { DrawerContextProvider } = getSharedScope()[NOTIF_DRAWER_MODULE]['1.0.0'].get();

    return (
      <>
        <DrawerContextProvider>
          <DrawerPanelBase panelRef={innerRef} {...props} />
        </DrawerContextProvider>
      </>
    );
  };

  return (
    <>
      {RegisterDrawerModule && <RegisterDrawerModule />}
      {isNotificationsDrawerReady && <DrawerPanelProvider />}
    </>
  );
});
DrawerPanel.displayName = 'DrawerPanel';

export default DrawerPanel;

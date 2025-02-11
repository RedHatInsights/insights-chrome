import React, { useContext } from 'react';

import { NotificationDrawer } from '@patternfly/react-core/dist/dynamic/components/NotificationDrawer';

import ChromeAuthContext from '../../auth/ChromeAuthContext';

import { getSharedScope } from '@scalprum/core';

export type DrawerPanelProps = {
  panelRef: React.Ref<unknown>;
  toggleDrawer: () => void;
};
const NOTIF_DRAWER_MODULE = '@notif-module/drawer';

const DrawerPanelBase: React.FC<DrawerPanelProps> = ({ panelRef, toggleDrawer }) => {
  const auth = useContext(ChromeAuthContext);
  const isOrgAdmin = auth?.user?.identity?.user?.is_org_admin;
  const notificationProps = {
    isOrgAdmin: isOrgAdmin,
    panelRef: panelRef,
    toggleDrawer: toggleDrawer,
  };

  const { DrawerPanel } = getSharedScope()[NOTIF_DRAWER_MODULE]['1.0.0'].get();

  return (
    <NotificationDrawer ref={panelRef} {...notificationProps}>
      <DrawerPanel {...notificationProps} />
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef<unknown, Omit<DrawerPanelProps, 'panelRef'>>((props, innerRef) => {
  return <DrawerPanelBase panelRef={innerRef} {...props} />;
});
DrawerPanel.displayName = 'DrawerPanel';

export default DrawerPanel;

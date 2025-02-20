import React, { useContext } from 'react';

import { NotificationDrawer } from '@patternfly/react-core/dist/dynamic/components/NotificationDrawer';

import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { useNotificationsScope } from '../../hooks/useNotificationsScope';

export type DrawerPanelProps = {
  panelRef: React.Ref<unknown>;
  toggleDrawer: () => void;
};

const DrawerPanelBase: React.FC<DrawerPanelProps> = ({ panelRef, toggleDrawer }) => {
  const auth = useContext(ChromeAuthContext);
  const isOrgAdmin = auth?.user?.identity?.user?.is_org_admin;
  const notificationProps = {
    isOrgAdmin: isOrgAdmin,
    panelRef: panelRef,
    toggleDrawer: toggleDrawer,
  };

  const { DrawerPanel } = useNotificationsScope();

  return (
    <NotificationDrawer ref={panelRef}>
      <DrawerPanel {...notificationProps} />
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef<unknown, Omit<DrawerPanelProps, 'panelRef'>>((props, innerRef) => {
  return <DrawerPanelBase panelRef={innerRef} {...props} />;
});
DrawerPanel.displayName = 'DrawerPanel';

export default DrawerPanel;

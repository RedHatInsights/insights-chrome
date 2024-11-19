import React, { Fragment, useContext } from 'react';

import { NotificationDrawer } from '@patternfly/react-core/dist/dynamic/components/NotificationDrawer';

import ChromeAuthContext from '../../auth/ChromeAuthContext';
import InternalChromeContext from '../../utils/internalChromeContext';

import { ScalprumComponent } from '@scalprum/react-core';

export type DrawerPanelProps = {
  panelRef: React.Ref<unknown>;
  // toggle: () => void;
};

const DrawerPanelBase = ({ panelRef }: DrawerPanelProps) => {
  // toggle drawer will be an api or prop

  const auth = useContext(ChromeAuthContext);
  const isOrgAdmin = auth?.user?.identity?.user?.is_org_admin;
  const { getUserPermissions } = useContext(InternalChromeContext);

  const notificationProps = {
    isOrgAdmin: isOrgAdmin,
    getUserPermissions: getUserPermissions,
    panelRef: panelRef,
    expanded: true,
    // toggle: toggle,
  };
  const PanelContent = () => {
    return (
      <ScalprumComponent scope="notifications" module="./NotificationsDrawer" fallback={null} ErrorComponent={<Fragment />} {...notificationProps} />
    );
  };

  return (
    <NotificationDrawer ref={panelRef}>
      <PanelContent></PanelContent>
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef((props, innerRef) => <DrawerPanelBase panelRef={innerRef} {...props} />);

export default DrawerPanel;

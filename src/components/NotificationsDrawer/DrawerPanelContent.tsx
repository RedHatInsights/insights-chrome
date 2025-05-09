import React from 'react';

import { NotificationDrawer } from '@patternfly/react-core/dist/dynamic/components/NotificationDrawer';
import Spinner from '@redhat-cloud-services/frontend-components/Spinner';
import classNames from 'classnames';

import { ScalprumComponent } from '@scalprum/react-core';
import { useAtomValue } from 'jotai';
import { drawerPanelContentAtom } from '../../state/atoms/drawerPanelContentAtom';

export type DrawerPanelProps = {
  panelRef: React.Ref<unknown>;
  toggleDrawer: () => void;
};
const DrawerPanelBase = (props: DrawerPanelProps) => {
  const drawerContent = useAtomValue(drawerPanelContentAtom);

  if (!drawerContent) {
    return null;
  }

  return (
    // Need the v5 styles here in order for pf5 nested child drawer nodes to be properly styled until pf6 migration is finished
    <NotificationDrawer className={classNames('pf-v5-c-notification-drawer', drawerContent.scope)} ref={props.panelRef}>
      <ScalprumComponent {...drawerContent} {...props} fallback={<Spinner centered />} />
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef<unknown, Omit<DrawerPanelProps, 'panelRef'>>((props, innerRef) => {
  return <DrawerPanelBase panelRef={innerRef} {...props} />;
});
DrawerPanel.displayName = 'DrawerPanel';

export default DrawerPanel;

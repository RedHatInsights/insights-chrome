import React, { useEffect, useState } from 'react';
import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerGroup,
  NotificationDrawerGroupList,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core';
import { useDispatch, useSelector } from 'react-redux';

const NotificationsContent = () => {
  const [isBroadcastExpanded, setBroadcastExpanded] = useState(false);
  const notifications = useSelector(({ chrome: { notifications } }) => notifications || []);
  const dispatch = useDispatch();
  return (
    <DrawerPanelContent>
      <NotificationDrawer>
        <NotificationDrawerHeader customText="Foo bar">
          <DrawerActions>
            <DrawerCloseButton onClick={() => dispatch({ type: 'toggle-notifications-drawer' })} />
          </DrawerActions>
        </NotificationDrawerHeader>
        <NotificationDrawerBody>
          <NotificationDrawerGroupList>
            <NotificationDrawerGroup onExpand={(_e, value) => setBroadcastExpanded(value)} isExpanded={isBroadcastExpanded} title="Boradcast">
              <NotificationDrawerList isHidden={!isBroadcastExpanded}>
                {notifications.map(({ variant = 'info', title, description }, idx) => (
                  <NotificationDrawerListItem key={idx} variant={variant}>
                    <NotificationDrawerListItemHeader variant={variant} title={title} />
                    <NotificationDrawerListItemBody timestamp="Just now">{description}</NotificationDrawerListItemBody>
                  </NotificationDrawerListItem>
                ))}
              </NotificationDrawerList>
            </NotificationDrawerGroup>
          </NotificationDrawerGroupList>
        </NotificationDrawerBody>
      </NotificationDrawer>
    </DrawerPanelContent>
  );
};

const Notifications = ({ children }) => {
  const isNotificationsDrawerOpen = useSelector(({ chrome: { isNotificationsDrawerOpen } }) => isNotificationsDrawerOpen);
  return (
    <Drawer isExpanded={isNotificationsDrawerOpen}>
      <DrawerContent panelContent={<NotificationsContent />}>
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default Notifications;

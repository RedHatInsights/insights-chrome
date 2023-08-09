import React, { useState } from 'react';
import {
  Checkbox,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  KebabToggle,
  Label,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core';
import { useDispatch } from 'react-redux';
import { Notifications } from '../../redux/store';
import { markNotificationAsRead, markNotificationAsUnread } from '../../redux/actions';

const NotificationItem = ({ notification }: { notification: Notifications['data'][0] }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dispatch = useDispatch();

  const onDropdownToggle = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
  };

  const onCheckboxToggle = () => {
    if (!notification.read) dispatch(markNotificationAsRead(notification.id));
    else dispatch(markNotificationAsUnread(notification.id));
  };

  const dropdownItems = [<DropdownItem key="read" onClick={onCheckboxToggle}>{`Mark as ${!notification.read ? 'read' : 'unread'}`}</DropdownItem>];

  return (
    <React.Fragment>
      <NotificationDrawerList>
        <NotificationDrawerListItem variant="info" isRead={notification.read}>
          <NotificationDrawerListItemHeader title={notification.title} srTitle="Info notification:">
            <Checkbox isChecked={notification.read} onChange={onCheckboxToggle} id="read-checkbox" name="read-checkbox" />
            <Dropdown
              position={DropdownPosition.right}
              toggle={<KebabToggle onToggle={onDropdownToggle} id="kebab-toggle" />}
              isOpen={isDropdownOpen}
              isPlain
              dropdownItems={dropdownItems}
              id="notification-dropdown"
            />
          </NotificationDrawerListItemHeader>
          {/* TODO: Modify timestamp to only show correct "x minutes ago" */}
          <NotificationDrawerListItemBody timestamp={`${notification.created}`}>
            <Label variant="outline" isCompact className="pf-u-mb-md">
              {notification.source}
            </Label>
            <span className="pf-u-display-block">{notification.description}</span>
          </NotificationDrawerListItemBody>
        </NotificationDrawerListItem>
      </NotificationDrawerList>
    </React.Fragment>
  );
};

export default NotificationItem;

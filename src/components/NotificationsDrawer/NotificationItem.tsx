import React, { useState } from 'react';
import {
  Label,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  Checkbox,
  KebabToggle,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core';
import { Notifications } from '../../redux/store';

// TODO: Switch from local state to redux management. Needed for "mark all visible" functionality from the panel.
const NotificationItem = ({ notification }: { notification: Notifications["data"][0] }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationRead, setIsNotificationRead] = useState(false);
  console.log('This is my current notification item: ', notification);

  const onDropdownToggle = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
  }

  const onCheckboxToggle = () => {
    setIsNotificationRead(!isNotificationRead);
  }

  const dropdownItems = [
    <DropdownItem key='read' onClick={onCheckboxToggle}>{`Mark as ${!isNotificationRead ? 'read' : 'unread'}`}</DropdownItem>,
  ]

  return (
    <React.Fragment>
      <NotificationDrawerList>
        <NotificationDrawerListItem 
          variant="info"
          isRead={isNotificationRead}
        >
          <NotificationDrawerListItemHeader
            title={notification.title}
            srTitle="Info notification:"
          >
            <Checkbox
              isChecked={isNotificationRead}
              onChange={onCheckboxToggle}
              id="read-checkbox"
              name="read-checkbox"
            />        
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
              <Label variant="outline" isCompact className='pf-u-mb-md'>{notification.source}</Label>
              <span className='pf-u-display-block'>{notification.description}</span>
            </NotificationDrawerListItemBody>
        </NotificationDrawerListItem>
      </NotificationDrawerList>
    </React.Fragment>
  );
};

export default NotificationItem;

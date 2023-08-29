import React, { useState } from 'react';
import {
  Checkbox,
  Dropdown,
  DropdownItem,
  Label,
  MenuToggle,
  MenuToggleElement,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import { useDispatch } from 'react-redux';
import { NotificationData } from '../../redux/store';
import { markNotificationAsRead, markNotificationAsUnread } from '../../redux/actions';

const NotificationItem = ({ notification }: { notification: NotificationData }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dispatch = useDispatch();

  const onCheckboxToggle = () => {
    dispatch(!notification.read ? markNotificationAsRead(notification.id) : markNotificationAsUnread(notification.id));
    setIsDropdownOpen(false);
  };

  const dropdownItems = [<DropdownItem key="read" onClick={onCheckboxToggle}>{`Mark as ${!notification.read ? 'read' : 'unread'}`}</DropdownItem>];

  return (
    <React.Fragment>
      <NotificationDrawerList>
        <NotificationDrawerListItem variant="info" isRead={notification.read}>
          <NotificationDrawerListItemHeader title={notification.title} srTitle="Info notification:">
            <Checkbox isChecked={notification.read} onChange={() => onCheckboxToggle()} id="read-checkbox" name="read-checkbox" />
            <Dropdown
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  aria-label="Notification actions dropdown"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  id="kebab-toggle"
                  isExpanded={isDropdownOpen}
                  variant="plain"
                >
                  <EllipsisVIcon />
                </MenuToggle>
              )}
              isOpen={isDropdownOpen}
              isPlain
              id="notification-dropdown"
            >
              {dropdownItems.map((dropDownItem) => dropDownItem)}
            </Dropdown>
          </NotificationDrawerListItemHeader>
          {/* TODO: Modify timestamp to only show correct "x minutes ago" */}
          <NotificationDrawerListItemBody timestamp={`${notification.created.split('GMT')[0].trim()}`}>
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

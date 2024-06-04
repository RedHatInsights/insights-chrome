import React, { useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core/dist/dynamic/components/NotificationDrawer';
import { PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import EllipsisVIcon from '@patternfly/react-icons/dist/dynamic/icons/ellipsis-v-icon';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { NotificationData, updateNotificationReadAtom } from '../../state/atoms/notificationDrawerAtom';

interface NotificationItemProps {
  notification: NotificationData;
  onNavigateTo: (link: string) => void;
}
const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onNavigateTo }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const updateNotificationRead = useSetAtom(updateNotificationReadAtom);

  const onCheckboxToggle = () => {
    updateNotificationRead(notification.id, !notification.read);
    setIsDropdownOpen(false);
  };

  const notificationDropdownItems = [
    <DropdownItem key="read" onClick={onCheckboxToggle}>{`Mark as ${!notification.read ? 'read' : 'unread'}`}</DropdownItem>,
    <DropdownItem key="manage-event" onClick={() => onNavigateTo('settings/notifications/configure-events')}>
      Manage this event
    </DropdownItem>,
  ];
  return (
    <React.Fragment>
      <NotificationDrawerList>
        <NotificationDrawerListItem aria-label={`Notification item ${notification.title}`} variant="info" isRead={notification.read}>
          <NotificationDrawerListItemHeader title={notification.title} srTitle="Info notification:">
            <Checkbox isChecked={notification.read} onChange={onCheckboxToggle} id="read-checkbox" name="read-checkbox" />
            <Dropdown
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  aria-label="Notification actions dropdown"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  id="notification-item-toggle"
                  isExpanded={isDropdownOpen}
                  variant="plain"
                >
                  <EllipsisVIcon />
                </MenuToggle>
              )}
              isOpen={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
              popperProps={{
                position: PopoverPosition.right,
              }}
              id="notification-item-dropdown"
            >
              <DropdownList>{notificationDropdownItems}</DropdownList>
            </Dropdown>
          </NotificationDrawerListItemHeader>
          <NotificationDrawerListItemBody timestamp={<DateFormat date={notification.created} />}>
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

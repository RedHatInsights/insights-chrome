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
import { NotificationData, updateNotificationReadAtom, updateNotificationSelectedAtom } from '../../state/atoms/notificationDrawerAtom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NotificationItemProps {
  notification: NotificationData;
  onNavigateTo: (link: string) => void;
}
const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onNavigateTo }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const updateNotificationSelected = useSetAtom(updateNotificationSelectedAtom);
  const updateNotificationRead = useSetAtom(updateNotificationReadAtom);

  const onCheckboxToggle = () => {
    updateNotificationSelected(notification.id, !notification.selected);
  };

  const onMarkAsRead = () => {
    axios
      .put('/api/notifications/v1/notifications/drawer/read', {
        notification_ids: [notification.id],
        read_status: !notification.read,
      })
      .then(() => {
        updateNotificationRead(notification.id, !notification.read);
        setIsDropdownOpen(false);
      })
      .catch((e) => {
        console.error('failed to update notification read status', e);
      });
  };

  const notificationDropdownItems = [
    <DropdownItem key="read" onClick={onMarkAsRead}>{`Mark as ${!notification.read ? 'read' : 'unread'}`}</DropdownItem>,
    <DropdownItem
      key="manage-event"
      onClick={() => onNavigateTo(`/settings/notifications/configure-events?bundle=${notification.bundle}&tab=configuration`)}
    >
      Manage this event
    </DropdownItem>,
  ];
  return (
    <React.Fragment>
      <NotificationDrawerList>
        <NotificationDrawerListItem aria-label={`Notification item ${notification.title}`} variant="info" isRead={notification.read}>
          <NotificationDrawerListItemHeader title={notification.title} srTitle="Info notification:">
            <Checkbox isChecked={notification.selected} onChange={onCheckboxToggle} id="selected-checkbox" name="selected-checkbox" />
            <Dropdown
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  aria-label="Notification actions dropdown"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  id="notification-item-toggle"
                  isExpanded={isDropdownOpen}
                  variant="plain"
                  icon={<EllipsisVIcon />}
                />
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
            <span className="pf-u-display-block">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notification.description}</ReactMarkdown>
            </span>
          </NotificationDrawerListItemBody>
        </NotificationDrawerListItem>
      </NotificationDrawerList>
    </React.Fragment>
  );
};

export default NotificationItem;

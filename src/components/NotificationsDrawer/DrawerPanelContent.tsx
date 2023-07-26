import React, { useState } from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  KebabToggle,
  Dropdown,
  DropdownToggle,
  DropdownItem,
  DropdownSeparator,
  DropdownPosition,
  NotificationDrawer,
  NotificationDrawerList,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  Text,
  Title,
} from '@patternfly/react-core';
import { useDispatch, useSelector } from 'react-redux';
import { 
  toggleNotificationsDrawer,
  markAllNotificationsAsRead,
  markAllNotificationsAsUnread,
} from '../../redux/actions';
import FilterIcon from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import BellSlashIcon from '@patternfly/react-icons/dist/esm/icons/bell-slash-icon';
import ExternalLinkSquareAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-square-alt-icon';
import { ReduxState } from '../../redux/store';
import NotificationItem from './NotificationItem';
import { MARK_ALL_NOTIFICATION_AS_READ } from '../../redux/action-types';

export type DrawerPanelProps = {
  innerRef: React.Ref<unknown>;
};

const EmptyNotifications = () => (
  <EmptyState>
    <EmptyStateIcon icon={BellSlashIcon} />
    <Title headingLevel="h4" size="lg">
      No notifications found
    </Title>
    <EmptyStateBody>
      <Button
        component="a"
        variant="link"
        icon={<ExternalLinkSquareAltIcon />}
        iconPosition="right"
        href="./user-preferences/notifications"
        target="_blank"
      >
        Check your User Preferences
      </Button>
      <Text>Contact your Organization Administrator</Text>
    </EmptyStateBody>
  </EmptyState>
);

const DrawerPanelBase = ({ innerRef }: DrawerPanelProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const notifications = useSelector(({ chrome: { notifications } }: ReduxState) => notifications?.data || []);

  const onDropdownToggle = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
  };

  const onFilterDropdownToggle = (isOpen: boolean) => {
    setIsFilterDropdownOpen(isOpen);
  };

  // const onMarkAllAsRead = () => {
  //   console.log('MARKING ALL AS READ');

  //   notifications.map((notification, index) => {
  //     if(!notification.read){
  //       notification.read = true; // TODO: Switch to redux state changes
  //     }
  //   });
  // }

  const onMarkAllAsRead = () => {
    console.log('MARKING ALL AS READ');
    dispatch({ type: MARK_ALL_NOTIFICATION_AS_READ });
  };

  const onMarkAllAsUnread = () => {
    notifications.map((notification, index) => {
      if(notification.read){
        notification.read = false;
      }
    });
  }

  const dropdownItems = [
    <DropdownItem key="read all" onClick={onMarkAllAsRead}>Mark visible as read</DropdownItem>,
    <DropdownItem key="unread all" onClick={onMarkAllAsUnread}>Mark visible as unread</DropdownItem>,
    <DropdownSeparator key="separator" />,
    <DropdownItem icon={ ExternalLinkSquareAltIcon }>View event log</DropdownItem>,
    <DropdownItem icon={ ExternalLinkSquareAltIcon }>Configure notifications settings</DropdownItem>,
    <DropdownItem icon={ ExternalLinkSquareAltIcon }>Manage my notification preferences</DropdownItem>,
  ];

  const filterDropdownItems = () => {
    const uniqueSources = new Set(notifications.map(notification => notification.source));
    return Array.from(uniqueSources).map((source, index) => (
      <DropdownItem key={index}>{source}</DropdownItem>
    ));     
  };
 
  return (
    <NotificationDrawer ref={innerRef}>
      <NotificationDrawerHeader onClose={() => dispatch(toggleNotificationsDrawer())}>
        <Dropdown 
          toggle={
            <DropdownToggle toggleIndicator={null} onToggle={onFilterDropdownToggle} id='filter-toggle'>
              <FilterIcon />
            </DropdownToggle>
          }
          isOpen={isFilterDropdownOpen}
          dropdownItems={filterDropdownItems()}
          id='filter-dropdown'
          aria-label="Notifications filter"
          isPlain
        />
        <Dropdown
          position={DropdownPosition.right}
          toggle={<KebabToggle onToggle={onDropdownToggle} id="kebab-toggle" />}
          isOpen={isDropdownOpen}
          isPlain
          dropdownItems={dropdownItems}
          id="notification-dropdown"
        />
      </NotificationDrawerHeader>
        <NotificationDrawerBody>
          <NotificationDrawerList>
            {notifications.length === 0 ? <EmptyNotifications /> : notifications.map((notification, index) => (
              <NotificationItem key={index} notification={notification} />
            ))}
          </NotificationDrawerList>
      </NotificationDrawerBody>
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef((props, innerRef) => <DrawerPanelBase innerRef={innerRef} {...props} />);

export default DrawerPanel;

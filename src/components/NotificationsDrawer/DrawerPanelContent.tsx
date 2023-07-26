import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  DropdownSeparator,
  DropdownToggle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  KebabToggle,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  Text,
  Title,
} from '@patternfly/react-core';
import { useDispatch, useSelector } from 'react-redux';
import { toggleNotificationsDrawer } from '../../redux/actions';
import FilterIcon from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import BellSlashIcon from '@patternfly/react-icons/dist/esm/icons/bell-slash-icon';
import ExternalLinkSquareAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-square-alt-icon';
import { NotificationData, ReduxState } from '../../redux/store';
import NotificationItem from './NotificationItem';
import { MARK_ALL_NOTIFICATION_AS_READ, MARK_ALL_NOTIFICATION_AS_UNREAD } from '../../redux/action-types';

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
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationData[]>([]);
  const dispatch = useDispatch();
  const notifications = useSelector(({ chrome: { notifications } }: ReduxState) => notifications?.data || []);

  const onNotificationsDrawerClose = () => {
    setFilteredNotifications([]);
    dispatch(toggleNotificationsDrawer());
  };

  const onDropdownToggle = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
  };

  const onFilterDropdownToggle = (isOpen: boolean) => {
    setIsFilterDropdownOpen(isOpen);
  };

  const onMarkAllAsRead = () => {
    dispatch({ type: MARK_ALL_NOTIFICATION_AS_READ });
    onDropdownToggle(false);
  };

  const onMarkAllAsUnread = () => {
    dispatch({ type: MARK_ALL_NOTIFICATION_AS_UNREAD });
    onDropdownToggle(false);
  };

  const onFilterSelect = (chosenFilter: string) => {
    setFilteredNotifications(notifications.filter((notification) => notification.source === chosenFilter));
    onFilterDropdownToggle(false);
  };

  const dropdownItems = [
    <DropdownItem key="read all" onClick={onMarkAllAsRead}>
      Mark visible as read
    </DropdownItem>,
    <DropdownItem key="unread all" onClick={onMarkAllAsUnread}>
      Mark visible as unread
    </DropdownItem>,
    <DropdownSeparator key="separator" />,
    <DropdownItem key="event log" icon={ExternalLinkSquareAltIcon}>
      View event log
    </DropdownItem>,
    <DropdownItem key="notification settings" icon={ExternalLinkSquareAltIcon}>
      Configure notificatio settings
    </DropdownItem>,
    <DropdownItem key="notification preferences" icon={ExternalLinkSquareAltIcon}>
      Manage my notification preferences
    </DropdownItem>,
  ];

  const filterDropdownItems = () => {
    const uniqueSources = new Set(notifications.map((notification) => notification.source));
    return Array.from(uniqueSources).map((source, index) => (
      <DropdownItem key={index} onClick={() => onFilterSelect(source)}>
        {source}
      </DropdownItem>
    ));
  };

  const renderNotifications = () => {
    if (notifications.length === 0) {
      return <EmptyNotifications />;
    }

    if (filteredNotifications?.length > 0) {
      return filteredNotifications?.map((notification, index) => <NotificationItem key={index} notification={notification} />);
    } else {
      return notifications.map((notification, index) => <NotificationItem key={index} notification={notification} />);
    }
  };

  return (
    <NotificationDrawer ref={innerRef}>
      <NotificationDrawerHeader onClose={() => onNotificationsDrawerClose()}>
        <Dropdown
          toggle={
            <DropdownToggle toggleIndicator={null} onToggle={onFilterDropdownToggle} id="filter-toggle">
              <FilterIcon />
            </DropdownToggle>
          }
          isOpen={isFilterDropdownOpen}
          dropdownItems={filterDropdownItems()}
          id="filter-dropdown"
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
        <NotificationDrawerList>{renderNotifications()}</NotificationDrawerList>
      </NotificationDrawerBody>
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef((props, innerRef) => <DrawerPanelBase innerRef={innerRef} {...props} />);

export default DrawerPanel;

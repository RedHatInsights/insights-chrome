import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Divider,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Icon,
  MenuToggle,
  MenuToggleElement,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  Text,
  Title,
} from '@patternfly/react-core';
import { useDispatch, useSelector } from 'react-redux';
import FilterIcon from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import BellSlashIcon from '@patternfly/react-icons/dist/esm/icons/bell-slash-icon';
import ExternalLinkSquareAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-square-alt-icon';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import { orderBy } from 'lodash';
import { NotificationData, ReduxState } from '../../redux/store';
import NotificationItem from './NotificationItem';
import { markAllNotificationsAsRead, markAllNotificationsAsUnread, toggleNotificationsDrawer } from '../../redux/actions';

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
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationData[]>([]);
  const dispatch = useDispatch();
  const notifications = useSelector(({ chrome: { notifications } }: ReduxState) => notifications?.data || []);

  useEffect(() => {
    const modifiedNotifications = (activeFilters || []).reduce(
      (acc: NotificationData[], chosenFilter: string) => [...acc, ...notifications.filter(({ source }) => source === chosenFilter)],
      []
    );

    setFilteredNotifications(modifiedNotifications);
  }, [activeFilters]);

  const onNotificationsDrawerClose = () => {
    setActiveFilters([]);
    dispatch(toggleNotificationsDrawer());
  };

  const onMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
    setIsDropdownOpen(false);
  };

  const onMarkAllAsUnread = () => {
    dispatch(markAllNotificationsAsUnread());
    setIsDropdownOpen(false);
  };

  const onFilterSelect = (chosenFilter: string) => {
    activeFilters.includes(chosenFilter)
      ? setActiveFilters(activeFilters.filter((filter) => filter !== chosenFilter))
      : setActiveFilters([...activeFilters, chosenFilter]);
  };

  const dropdownItems = [
    <DropdownItem key="read all" onClick={() => onMarkAllAsRead()}>
      Mark visible as read
    </DropdownItem>,
    <DropdownItem key="unread all" onClick={() => onMarkAllAsUnread()}>
      Mark visible as unread
    </DropdownItem>,
    <Divider key="divider" />,
    <DropdownItem key="event log">
      <Icon>
        <ExternalLinkSquareAltIcon />
      </Icon>
      View event log
    </DropdownItem>,
    <DropdownItem key="notification settings">
      <Icon>
        <ExternalLinkSquareAltIcon />
      </Icon>
      Configure notification settings
    </DropdownItem>,
    <DropdownItem key="notification preferences">
      <Icon>
        <ExternalLinkSquareAltIcon />
      </Icon>
      Manage my notification preferences
    </DropdownItem>,
  ];

  const filterDropdownItems = () => {
    const sources = notifications.reduce((acc: string[], { source }) => (acc.includes(source) ? acc : [...acc, source]), []);

    return [
      <DropdownGroup key="filter-label" label="Show notifications for...">
        {sources.map((source, index) => (
          <DropdownItem key={index} onClick={() => onFilterSelect(source)}>
            <Checkbox isChecked={activeFilters.includes(source)} id={index.toString()} className="pf-u-mr-xs" />
            {source}
          </DropdownItem>
        ))}
        <Divider />
        <DropdownItem key="reset-filters" onClick={() => setActiveFilters([])}>
          <Button variant="link" isInline>
            Reset filters
          </Button>
        </DropdownItem>
      </DropdownGroup>,
    ];
  };

  const renderNotifications = () => {
    if (notifications.length === 0) {
      return <EmptyNotifications />;
    }

    const sortedNotifications = orderBy(
      filteredNotifications?.length > 0 ? filteredNotifications : notifications,
      ['read', 'created'],
      ['asc', 'asc']
    );

    return sortedNotifications.map((notification, index) => <NotificationItem key={index} notification={notification} />);
  };

  return (
    <NotificationDrawer ref={innerRef}>
      <NotificationDrawerHeader onClose={() => onNotificationsDrawerClose()}>
        {activeFilters.length > 0 && <Badge isRead>{activeFilters.length}</Badge>}
        <Dropdown
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              id="filter-toggle"
              isFullWidth
              variant="plainText"
            >
              <FilterIcon />
            </MenuToggle>
          )}
          isOpen={isFilterDropdownOpen}
          id="filter-dropdown"
          aria-label="Notifications filter"
          isPlain
        >
          {filterDropdownItems()}
        </Dropdown>
        <Dropdown
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle ref={toggleRef} onClick={() => setIsDropdownOpen(!isDropdownOpen)} variant="plainText" id="kebab-toggle" isFullWidth>
              <EllipsisVIcon />
            </MenuToggle>
          )}
          isOpen={isDropdownOpen}
          isPlain
          id="notification-dropdown"
        >
          {dropdownItems.map((dropdownItem) => dropdownItem)}
        </Dropdown>
      </NotificationDrawerHeader>
      <NotificationDrawerBody>
        <NotificationDrawerList>{renderNotifications()}</NotificationDrawerList>
      </NotificationDrawerBody>
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef((props, innerRef) => <DrawerPanelBase innerRef={innerRef} {...props} />);

export default DrawerPanel;

import React, { useEffect, useState } from 'react';
import { PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Badge } from '@patternfly/react-core/dist/dynamic/components/Badge';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Dropdown, DropdownGroup, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateBody, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import {
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
} from '@patternfly/react-core/dist/dynamic/components/NotificationDrawer';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useDispatch, useSelector } from 'react-redux';
import FilterIcon from '@patternfly/react-icons/dist/dynamic/icons/filter-icon';
import BellSlashIcon from '@patternfly/react-icons/dist/dynamic/icons/bell-slash-icon';
import ExternalLinkSquareAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-square-alt-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import EllipsisVIcon from '@patternfly/react-icons/dist/dynamic/icons/ellipsis-v-icon';
import orderBy from 'lodash/orderBy';
import { useNavigate } from 'react-router-dom';
import { NotificationData, ReduxState } from '../../redux/store';
import NotificationItem from './NotificationItem';
import { markAllNotificationsAsRead, markAllNotificationsAsUnread, toggleNotificationsDrawer } from '../../redux/actions';
import { filterConfig } from './notificationDrawerUtils';

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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notifications = useSelector(({ chrome: { notifications } }: ReduxState) => notifications?.data || []);
  const isOrgAdmin = useSelector(({ chrome }: ReduxState) => chrome.user?.identity.user?.is_org_admin);

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

  const onNavigateTo = (link: string) => {
    navigate(link);
    onNotificationsDrawerClose();
  };

  const dropdownItems = [
    <DropdownItem key="read all" onClick={onMarkAllAsRead} isDisabled={notifications.length === 0}>
      Mark visible as read
    </DropdownItem>,
    <DropdownItem key="unread all" onClick={onMarkAllAsUnread} isDisabled={notifications.length === 0}>
      Mark visible as unread
    </DropdownItem>,
    <Divider key="divider" />,
    <DropdownItem key="event log" onClick={() => onNavigateTo('/settings/notifications/eventlog')}>
      <Flex>
        <FlexItem>View event log</FlexItem>
        <FlexItem align={{ default: 'alignRight' }}>
          <Icon className="pf-v5-u-ml-auto">
            <ExternalLinkAltIcon />
          </Icon>
        </FlexItem>
      </Flex>
    </DropdownItem>,
    isOrgAdmin && (
      <DropdownItem key="notification settings" onClick={() => onNavigateTo('/settings/notifications/configure-events')}>
        <Flex>
          <FlexItem>Configure notification settings</FlexItem>
          <FlexItem align={{ default: 'alignRight' }}>
            <Icon className="pf-v5-u-ml-auto">
              <ExternalLinkAltIcon />
            </Icon>
          </FlexItem>
        </Flex>
      </DropdownItem>
    ),
    <DropdownItem key="notification preferences" onClick={() => onNavigateTo('/settings/notifications/user-preferences')}>
      <Flex>
        <FlexItem>Manage my notification preferences</FlexItem>
        <FlexItem align={{ default: 'alignRight' }}>
          <Icon className="pf-v5-u-ml-auto">
            <ExternalLinkAltIcon />
          </Icon>
        </FlexItem>
      </Flex>
    </DropdownItem>,
  ];

  const filterDropdownItems = () => {
    return [
      <DropdownGroup key="filter-label" label="Show notifications for...">
        <DropdownList>
          {filterConfig.map((source) => (
            <DropdownItem
              key={source.value}
              onClick={() => onFilterSelect(source.value)}
              isDisabled={notifications.length === 0}
              isSelected={activeFilters.includes(source.value)}
              hasCheckbox
            >
              {source.title}
            </DropdownItem>
          ))}
          <Divider />
          <DropdownItem key="reset-filters" isDisabled={activeFilters.length === 0} onClick={() => setActiveFilters([])}>
            Reset filters
          </DropdownItem>
        </DropdownList>
      </DropdownGroup>,
    ];
  };

  const renderNotifications = () => {
    if (notifications.length === 0) {
      return <EmptyNotifications />;
    }

    const sortedNotifications = orderBy(activeFilters?.length > 0 ? filteredNotifications : notifications, ['read', 'created'], ['asc', 'asc']);

    return sortedNotifications.map((notification) => (
      <NotificationItem key={notification.id} notification={notification} onNavigateTo={onNavigateTo} />
    ));
  };

  return (
    <NotificationDrawer ref={innerRef}>
      <NotificationDrawerHeader onClose={onNotificationsDrawerClose} title="Notifications" className="pf-u-align-items-center">
        {activeFilters.length > 0 && <Badge isRead>{activeFilters.length}</Badge>}
        <Dropdown
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              id="notifications-filter-toggle"
              variant="plain"
              aria-label="Notifications filter"
            >
              <FilterIcon />
            </MenuToggle>
          )}
          isOpen={isFilterDropdownOpen}
          onOpenChange={setIsFilterDropdownOpen}
          popperProps={{
            position: PopoverPosition.right,
          }}
          id="notifications-filter-dropdown"
        >
          {filterDropdownItems()}
        </Dropdown>
        <Dropdown
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              variant="plain"
              id="notifications-actions-toggle"
              aria-label="Notifications actions dropdown"
              isFullWidth
            >
              <EllipsisVIcon />
            </MenuToggle>
          )}
          isOpen={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
          popperProps={{
            position: PopoverPosition.right,
          }}
          id="notifications-actions-dropdown"
        >
          <DropdownList>{dropdownItems}</DropdownList>
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

import React, { useContext, useEffect, useState } from 'react';
import { PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { Badge } from '@patternfly/react-core/dist/dynamic/components/Badge';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Dropdown, DropdownGroup, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
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
import EllipsisVIcon from '@patternfly/react-icons/dist/dynamic/icons/ellipsis-v-icon';
import orderBy from 'lodash/orderBy';
import { Link, useNavigate } from 'react-router-dom';
import { NotificationData, ReduxState } from '../../redux/store';
import NotificationItem from './NotificationItem';
import {
  deselectAllNotifications,
  markNotificationsAsSelected,
  markSelectedNotificationsAsRead,
  markSelectedNotificationsAsUnread,
  selectAllNotifications,
  toggleNotificationsDrawer,
} from '../../redux/actions';
import { filterConfig } from './notificationDrawerUtils';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import InternalChromeContext from '../../utils/internalChromeContext';
import axios from 'axios';
import BulkSelect from '@redhat-cloud-services/frontend-components/BulkSelect';

export type DrawerPanelProps = {
  innerRef: React.Ref<unknown>;
};

const EmptyNotifications = ({ isOrgAdmin, onLinkClick }: { onLinkClick: () => void; isOrgAdmin?: boolean }) => (
  <EmptyState>
    <EmptyStateIcon icon={BellSlashIcon} />
    <Title headingLevel="h4" size="lg">
      No notifications found
    </Title>
    <EmptyStateBody>
      {isOrgAdmin ? (
        <Text>
          Try&nbsp;
          <Link onClick={onLinkClick} to="/settings/notifications/user-preferences">
            checking your notification preferences
          </Link>
          &nbsp;and managing the&nbsp;
          <Link onClick={onLinkClick} to="/settings/notifications/configure-events">
            notification configuration
          </Link>
          &nbsp;for your organization.
        </Text>
      ) : (
        <>
          <Link onClick={onLinkClick} to="/settings/notifications/configure-events">
            Configure notification settings
          </Link>
          .<Text>Contact your organization administrator.</Text>
        </>
      )}
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
  const auth = useContext(ChromeAuthContext);
  const isOrgAdmin = auth?.user?.identity?.user?.is_org_admin;
  const { getUserPermissions } = useContext(InternalChromeContext);
  const [hasNotificationsPermissions, setHasNotificationsPermissions] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchPermissions = async () => {
      const permissions = await getUserPermissions?.('notifications');
      if (mounted) {
        setHasNotificationsPermissions(
          permissions?.some((item) =>
            ['notifications:*:*', 'notifications:notifications:read', 'notifications:notifications:write'].includes(
              (typeof item === 'string' && item) || item?.permission
            )
          )
        );
      }
    };
    fetchPermissions();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    console.log('activeFilters', activeFilters);
    const modifiedNotifications = (activeFilters || []).reduce(
      (acc: NotificationData[], chosenFilter: string) => [...acc, ...notifications.filter(({ bundle }) => bundle.includes(chosenFilter))],
      []
    );

    setFilteredNotifications(modifiedNotifications);
  }, [activeFilters]);

  const onNotificationsDrawerClose = () => {
    setActiveFilters([]);
    dispatch(toggleNotificationsDrawer());
  };

  const onMarkSelectedAsRead = () => {
    setIsDropdownOpen(false);
    dispatch(markSelectedNotificationsAsRead());

    axios
      .put('/api/notifications/v1/notifications/drawer/read', {
        notification_ids: notifications.filter(({ selected }) => selected).map(({ id }) => id),
        read_status: true,
      })
      .then(() => {
        dispatch(deselectAllNotifications());
      })
      .catch((error) => {
        dispatch(markSelectedNotificationsAsUnread());
        console.error('Failed to update notification read status', error);
      });
  };

  const onMarkSelectedAsUnread = () => {
    setIsDropdownOpen(false);
    dispatch(markSelectedNotificationsAsUnread());

    axios
      .put('/api/notifications/v1/notifications/drawer/read', {
        notification_ids: notifications.filter(({ selected }) => selected).map(({ id }) => id),
        read_status: false,
      })
      .then(() => {
        dispatch(deselectAllNotifications());
      })
      .catch((error) => {
        dispatch(markSelectedNotificationsAsRead());
        console.error('Failed to update notification read status', error);
      });
  };

  const selectAll = () => {
    dispatch(selectAllNotifications());
  };

  const selectNone = () => {
    dispatch(deselectAllNotifications());
  };

  const selectCurrentlyVisible = () => {
    const visibleNotifications = activeFilters.length > 0 ? filteredNotifications : notifications;
    dispatch(markNotificationsAsSelected(visibleNotifications.map(({ id }) => id)));
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
    <DropdownItem key="actions" description="Actions" />,
    <DropdownItem key="read all" onClick={onMarkSelectedAsRead} isDisabled={notifications.length === 0}>
      Mark selected as read
    </DropdownItem>,
    <DropdownItem key="unread all" onClick={onMarkSelectedAsUnread} isDisabled={notifications.length === 0}>
      Mark selected as unread
    </DropdownItem>,
    <Divider key="divider" />,
    <DropdownItem key="quick links" description="Quick links" />,
    <DropdownItem key="notifications log" onClick={() => onNavigateTo('/settings/notifications/notificationslog')}>
      <Flex>
        <FlexItem>View notifications log</FlexItem>
      </Flex>
    </DropdownItem>,
    (isOrgAdmin || hasNotificationsPermissions) && (
      <DropdownItem key="notification settings" onClick={() => onNavigateTo('/settings/notifications/configure-events')}>
        <Flex>
          <FlexItem>Configure notification settings</FlexItem>
        </Flex>
      </DropdownItem>
    ),
    <DropdownItem key="notification preferences" onClick={() => onNavigateTo('/settings/notifications/user-preferences')}>
      <Flex>
        <FlexItem>Manage my notification preferences</FlexItem>
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
      return <EmptyNotifications isOrgAdmin={isOrgAdmin} onLinkClick={onNotificationsDrawerClose} />;
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
        <BulkSelect
          id="notifications-bulk-select"
          items={[
            { title: 'Select none (0)', key: 'select-none', onClick: selectNone },
            {
              title: `Select visible (${activeFilters.length > 0 ? filteredNotifications.length : notifications.length})`,
              key: 'select-visible',
              onClick: selectCurrentlyVisible,
            },
            { title: `Select all (${notifications.length})`, key: 'select-all', onClick: selectAll },
          ]}
          count={notifications.filter(({ selected }) => selected).length}
          checked={notifications.length > 0 && notifications.every(({ selected }) => selected)}
          ouiaId="notifications-bulk-select"
        />
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

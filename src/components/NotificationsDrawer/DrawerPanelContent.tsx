import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateBody, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { NotificationDrawer, NotificationDrawerHeader } from '@patternfly/react-core/dist/dynamic/components/NotificationDrawer';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useDispatch, useSelector } from 'react-redux';
import { toggleNotificationsDrawer } from '../../redux/actions';
import FilterIcon from '@patternfly/react-icons/dist/dynamic/icons/filter-icon';
import EllipsisVIcon from '@patternfly/react-icons/dist/dynamic/icons/ellipsis-v-icon';
import BellSlashIcon from '@patternfly/react-icons/dist/dynamic/icons/bell-slash-icon';
import ExternalLinkSquareAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-square-alt-icon';
import { ReduxState } from '../../redux/store';

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
  const dispatch = useDispatch();
  const notifications = useSelector(({ chrome: { notifications } }: ReduxState) => notifications?.data || []);
  return (
    <NotificationDrawer ref={innerRef}>
      <NotificationDrawerHeader onClose={() => dispatch(toggleNotificationsDrawer())}>
        <Button variant="plain" aria-label="Filter">
          <FilterIcon />
        </Button>
        <Button variant="plain" aria-label="Mark as read">
          <EllipsisVIcon />
        </Button>
      </NotificationDrawerHeader>
      {notifications.length === 0 ? <EmptyNotifications /> : 'TODO'}
    </NotificationDrawer>
  );
};

const DrawerPanel = React.forwardRef((props, innerRef) => <DrawerPanelBase innerRef={innerRef} {...props} />);

export default DrawerPanel;

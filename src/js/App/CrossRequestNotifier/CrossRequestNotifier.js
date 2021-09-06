import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import Portal from '@redhat-cloud-services/frontend-components-notifications/Portal';
import { ACTIVE_ACCOUNT_SWITCH_NOTIFICATION } from '../../consts';
import useAccessRequestNotifier from '../../utils/useAccessRequestNotifier';
import ChromeLink from '../Sidenav/Navigation/ChromeLink';

const ACCOUNT_CHANGE_ID = 'account_change';

const accountSwitchNotification = {
  id: ACCOUNT_CHANGE_ID,
  title: 'View has changed',
  description: 'You are now viewing cloud.redhat.com as a customer, and will be interacting with real customer data.',
  variant: 'info',
};

const defaultNotificationConfig = {
  variant: 'info',
  dismissable: true,
  title: 'You have a new access request that needs your review',
};

const DescriptionComponent = ({ id, markRead }) => (
  <span onClick={() => markRead(id)}>
    <ChromeLink href={id === 'mark-all' ? '/settings/rbac/access-requests' : `/settings/rbac/access-requests/${id}`} appId="rbac">
      View request
    </ChromeLink>
  </span>
);

DescriptionComponent.propTypes = {
  id: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]).isRequired,
  markRead: PropTypes.func.isRequired,
};

const CrossRequestNotifier = () => {
  const [, forceRender] = useReducer((state = false) => !state);
  const [{ data }, markRead] = useAccessRequestNotifier();
  const crossAccountNotifications = data.filter(({ seen }) => !seen);

  const removeNotification = (id) => {
    if (id === ACCOUNT_CHANGE_ID) {
      localStorage.removeItem(ACTIVE_ACCOUNT_SWITCH_NOTIFICATION);
      /**
       * We need this because local storage does not trigger render function and notification would be hanging
       */
      return forceRender();
    }
    markRead(id);
  };

  const notifications = localStorage.getItem(ACTIVE_ACCOUNT_SWITCH_NOTIFICATION) === 'true' ? [accountSwitchNotification] : [];
  if (crossAccountNotifications.length > 1) {
    notifications.push({
      ...defaultNotificationConfig,
      id: 'mark-all',
      description: <DescriptionComponent markRead={markRead} id="mark-all" />,
    });
  } else {
    notifications.push(
      ...crossAccountNotifications.map(({ request_id }) => ({
        ...defaultNotificationConfig,
        id: request_id,
        description: <DescriptionComponent markRead={markRead} id={request_id} />,
      }))
    );
  }
  return <Portal removeNotification={removeNotification} notifications={notifications} />;
};

export default CrossRequestNotifier;

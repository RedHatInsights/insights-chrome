import React, { useReducer } from 'react';
import Portal from '@redhat-cloud-services/frontend-components-notifications/Portal';
import { ACTIVE_ACCOUNT_SWITCH_NOTIFICATION } from '../../consts';

const ACCOUNT_CHANGE_ID = 'account_change';

const accountSwitchNotification = {
  id: ACCOUNT_CHANGE_ID,
  title: 'View has changed',
  description: 'You are now viewing cloud.redhat.com as a customer, and will be interacting with real customer data.',
  variant: 'info',
};

const CrossRequestNotifier = () => {
  const [, forceRender] = useReducer((state = false) => !state);
  const notifications = localStorage.getItem(ACTIVE_ACCOUNT_SWITCH_NOTIFICATION) === 'true' ? [accountSwitchNotification] : [];
  const removeNotification = (id) => {
    if (id === ACCOUNT_CHANGE_ID) {
      localStorage.removeItem(ACTIVE_ACCOUNT_SWITCH_NOTIFICATION);
      /**
       * We need this because local storage does not trigger render function and notification would be hanging
       */
      forceRender();
    }
  };
  return <Portal removeNotification={removeNotification} notifications={notifications} />;
};

export default CrossRequestNotifier;

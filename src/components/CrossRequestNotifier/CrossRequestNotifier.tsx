import React, { useReducer } from 'react';
import Portal, { PortalNotificationConfig } from '@redhat-cloud-services/frontend-components-notifications/Portal';
import { AlertVariant } from '@patternfly/react-core';
import { ACCOUNT_REQUEST_TIMEOUT, ACTIVE_ACCOUNT_SWITCH_NOTIFICATION } from '../../utils/consts';
import useAccessRequestNotifier from '../../utils/useAccessRequestNotifier';
import ChromeLink from '../ChromeLink';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';

const ACCOUNT_CHANGE_ID = 'account_change';
const ACCOUNT_TIMEOUT_ID = 'account_timeout';

const CrossRequestNotifier = () => {
  const [, forceRender] = useReducer((state) => state + 1, 0);
  const [{ data }, markRead] = useAccessRequestNotifier();
  const crossAccountNotifications = data.filter(({ seen }) => !seen);

  const intl = useIntl();

  const accountSwitchNotification: PortalNotificationConfig = {
    id: ACCOUNT_CHANGE_ID,
    title: `${intl.formatMessage(messages.viewChanged)}`,
    description: `${intl.formatMessage(messages.viewAsCustomer)}`,
    variant: 'info',
  };

  const defaultNotificationConfig: Omit<PortalNotificationConfig, 'id'> = {
    variant: 'info',
    dismissable: true,
    title: `${intl.formatMessage(messages.newRequestReview)}`,
  };

  const createAccoutTimeoutNotification = (accountId: string) => ({
    variant: AlertVariant.danger,
    id: ACCOUNT_TIMEOUT_ID,
    title: `${intl.formatMessage(messages.noLongerHaveAccess, { accountId })}`,
    autoDismiss: false,
  });

  const DescriptionComponent = ({ id, markRead }: { id: string; markRead: (id: string) => void }) => (
    <span onClick={() => markRead(id)}>
      <ChromeLink href={id === 'mark-all' ? '/settings/rbac/access-requests' : `/settings/rbac/access-requests/${id}`} appId="rbac">
        {intl.formatMessage(messages.viewRequest)}
      </ChromeLink>
    </span>
  );

  const removeNotification = (id: string | number) => {
    if (id === ACCOUNT_CHANGE_ID) {
      localStorage.removeItem(ACTIVE_ACCOUNT_SWITCH_NOTIFICATION);
      /**
       * We need this because local storage does not trigger render function and notification would be hanging
       */
      return forceRender();
    }
    if (id === ACCOUNT_TIMEOUT_ID) {
      localStorage.removeItem(ACCOUNT_REQUEST_TIMEOUT);
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

  const accountRequestTimeout = localStorage.getItem(ACCOUNT_REQUEST_TIMEOUT);
  if (accountRequestTimeout) {
    notifications.unshift(createAccoutTimeoutNotification(accountRequestTimeout));
  }
  return <Portal removeNotification={removeNotification} notifications={notifications} />;
};

export default CrossRequestNotifier;

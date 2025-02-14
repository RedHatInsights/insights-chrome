import { useContext, useEffect } from 'react';
import InternalChromeContext from '../../utils/internalChromeContext';

import { useAtomValue, useSetAtom } from 'jotai';
import {
  notificationDrawerScopeReadyAtom,
  notificationDrawerStateReadyAtom,
  notificationDrawerUnreadAtom,
} from '../../state/atoms/notificationDrawerAtom';

import { useNotificationsScope } from './NotificationsScope';

export const InitializeNotificaionDrawerState = () => {
  const { getUserPermissions } = useContext(InternalChromeContext);
  // eslint-disable-next-line no-unsafe-optional-chaining
  const { useNotificationDrawer } = useNotificationsScope();
  const { initialize, hasUnreadNotifications } = useNotificationDrawer();
  const setUnreadNotifications = useSetAtom(notificationDrawerUnreadAtom);
  const isNotificationsDrawerScopeReady = useAtomValue(notificationDrawerScopeReadyAtom);
  const setNotificationsDrawerStateReady = useSetAtom(notificationDrawerStateReadyAtom);

  if (!isNotificationsDrawerScopeReady) return;

  useEffect(() => {
    getUserPermissions('notifications').then((perms) => {
      initialize(true, perms).then(() => {
        setUnreadNotifications(hasUnreadNotifications());
        setNotificationsDrawerStateReady(true);
      });
    });
  }, []);

  return null;
};

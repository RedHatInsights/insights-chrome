import { getSharedScope } from '@scalprum/core';
import { NOTIF_DRAWER_MODULE } from './NotificationDrawerContextProvider';
import { useAtomValue } from 'jotai';
import { notificationDrawerScopeReadyAtom } from '../../state/atoms/notificationDrawerAtom';

export const useNotificationsScope = () => {
  const isNotificationsDrawerScopeReady = useAtomValue(notificationDrawerScopeReadyAtom);

  if (!isNotificationsDrawerScopeReady) {
    return {
      DrawerPanel: null,
      useNotificationDrawer: () => ({
        state: () => {},
        initialize: () => {},
        hasUnreadNotifications: () => {},
      }),
    };
  }
  if (!getSharedScope()[NOTIF_DRAWER_MODULE] || !getSharedScope()[NOTIF_DRAWER_MODULE]['1.0.0']) {
    throw new Error('Notifications drawer module not found');
  }
  const { DrawerPanel, useNotificationDrawer } = getSharedScope()[NOTIF_DRAWER_MODULE]['1.0.0'].get();
  return { DrawerPanel, useNotificationDrawer };
};

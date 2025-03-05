import { getSharedScope } from '@scalprum/core';
import { useAtomValue } from 'jotai';
import { Access } from '@redhat-cloud-services/rbac-client';

import { notificationDrawerScopeReadyAtom } from '../state/atoms/notificationDrawerAtom';

export const NOTIF_DRAWER_MODULE = '@notif-module/drawer';

export const getNotificationsScope = () => {
  const scope = getSharedScope()?.[NOTIF_DRAWER_MODULE]?.['1.0.0'].get();
  if (!scope) {
    throw new Error('Notifications drawer module not found');
  }
  return scope;
};

export const useNotificationsScope = (): {
  useNotificationDrawer: () => void;
  initialize: (mounted: boolean, permissions: Access[]) => Promise<void>;
} => {
  const isNotificationsDrawerScopeReady = useAtomValue(notificationDrawerScopeReadyAtom);

  if (!isNotificationsDrawerScopeReady) {
    return {
      useNotificationDrawer: () => {},
      initialize: async () => Promise.resolve(),
    };
  }
  const { useNotificationDrawer, initialize } = getNotificationsScope();
  return { useNotificationDrawer, initialize };
};

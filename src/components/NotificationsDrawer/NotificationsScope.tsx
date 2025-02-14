import { getSharedScope } from '@scalprum/core';
import { useAtomValue } from 'jotai';
import { Access } from '@redhat-cloud-services/rbac-client';

import { notificationDrawerScopeReadyAtom } from '../../state/atoms/notificationDrawerAtom';

export const NOTIF_DRAWER_MODULE = '@notif-module/drawer';

export const getNotificationsScope = () => {
  const scope = getSharedScope()?.[NOTIF_DRAWER_MODULE]?.['1.0.0'].get();
  if (!scope) {
    throw new Error('Notifications drawer module not found');
  }
  return scope;
};

export const useNotificationsScope = (): {
  DrawerPanel: React.ComponentType<React.PropsWithChildren<Record<string, any>>>;
  useNotificationDrawer: () => void;
  initialize: (mounted: boolean, permissions: Access[]) => Promise<void>;
  getState: () => { notificationData: { read?: boolean }[] };
} => {
  const isNotificationsDrawerScopeReady = useAtomValue(notificationDrawerScopeReadyAtom);

  if (!isNotificationsDrawerScopeReady) {
    return {
      DrawerPanel: () => null,
      useNotificationDrawer: () => {},
      initialize: async () => Promise.resolve(),
      getState: () => ({ notificationData: [] }),
    };
  }
  const { DrawerPanel, useNotificationDrawer, initialize, getState } = getNotificationsScope();
  return { DrawerPanel, useNotificationDrawer, initialize, getState };
};

import { useContext, useEffect } from 'react';
import { getModule } from '@scalprum/core';
import { useSetAtom } from 'jotai';
import InternalChromeContext from '../../utils/internalChromeContext';
import { notificationDrawerScopeReadyAtom } from '../../state/atoms/notificationDrawerAtom';
import { getNotificationsScope } from './NotificationsScope';

export const useNotificationDrawerStore = () => {
  const { getUserPermissions } = useContext(InternalChromeContext);
  const setNotificationsDrawerScopeReady = useSetAtom(notificationDrawerScopeReadyAtom);

  async function addScope() {
    try {
      const initNotificationScope = await getModule<() => void>('notifications', './initNotificationScope');
      initNotificationScope();
      setTimeout(async () => {
        const { initialize } = getNotificationsScope();
        getUserPermissions('notifications').then((perms) => {
          initialize(true, perms).then(setNotificationsDrawerScopeReady(true));
        });
      }, 0);
    } catch (error) {
      console.error('Failed to initialize notifications drawer', error);
    }
  }
  useEffect(() => {
    addScope();
  }, []);
};

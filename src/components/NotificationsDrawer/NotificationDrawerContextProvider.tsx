import React, { useEffect, useState } from 'react';

import { getModule } from '@scalprum/core';
import { useSetAtom } from 'jotai';
import { notificationDrawerScopeReadyAtom } from '../../state/atoms/notificationDrawerAtom';

export const NOTIF_DRAWER_MODULE = '@notif-module/drawer';

import { ReactNode } from 'react';

interface NotificationDrawerContextProviderProps {
  children: ReactNode;
}

export const NotificationDrawerContextProvider: React.FC<NotificationDrawerContextProviderProps> = ({ children }) => {
  const [NotificationDrawerContext, setNotificationDrawerContext] = useState<React.FC<NotificationDrawerContextProviderProps> | null>(null);
  const setisNotificationsDrawerScopeReady = useSetAtom(notificationDrawerScopeReadyAtom);

  useEffect(() => {
    const loadNotificationDrawerContext = async () => {
      try {
        const module = await getModule('notifications', './DrawerContextProvider');
        setNotificationDrawerContext(() => module as React.FC);
        setisNotificationsDrawerScopeReady(true);
      } catch (error) {
        console.error('Failed to load NotificationDrawerContext', error);
      }
    };

    loadNotificationDrawerContext();
  }, [setisNotificationsDrawerScopeReady]);

  // Render children only once the context component is available
  if (!NotificationDrawerContext) {
    return <>{children}</>;
  }

  return <NotificationDrawerContext>{children}</NotificationDrawerContext>;
};

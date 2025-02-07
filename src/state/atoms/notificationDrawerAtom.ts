import { atom } from 'jotai';

export type NotificationData = {
  id: string;
  title: string;
  description: string;
  read: boolean;
  selected?: boolean;
  source: string;
  bundle: string;
  created: string;
};

export type NotificationsPayload = {
  data: NotificationData;
  source: string;
  // cloud events sub protocol metadata
  datacontenttype: string;
  specversion: string;
  // a type field used to identify message purpose
  type: string;
  time: string;
};

export const notificationDrawerReadyAtom = atom(false);
export const notificationDrawerExpandedAtom = atom(false);
export const notificationDrawerDataAtom = atom<NotificationData[]>([]);
export const notificationDrawerCountAtom = atom(0);
export const notificationDrawerFilterAtom = atom<string[]>([]);
export const updateNotificationsStatusAtom = atom(null, (_get, set, read: boolean = false) => {
  set(notificationDrawerDataAtom, (prev) => prev.map((notification) => ({ ...notification, read })));
});
export const updateNotificationReadAtom = atom(null, (_get, set, id: string, read: boolean) => {
  set(notificationDrawerDataAtom, (prev) => prev.map((notification) => (notification.id === id ? { ...notification, read } : notification)));
});
export const unreadNotificationsAtom = atom((get) => get(notificationDrawerDataAtom).filter((notification) => !notification.read).length);
export const addNotificationAtom = atom(null, (_get, set, ...notifications: NotificationData[]) => {
  set(notificationDrawerDataAtom, (prev) => [...notifications, ...prev]);
  set(notificationDrawerCountAtom, (prev) => prev + notifications.length);
});
export const notificationDrawerSelectedAtom = atom((get) => get(notificationDrawerDataAtom).filter((notification) => notification.selected));
export const updateNotificationSelectedAtom = atom(null, (_get, set, id: string, selected: boolean) => {
  set(notificationDrawerDataAtom, (prev) => prev.map((notification) => (notification.id === id ? { ...notification, selected } : notification)));
});
export const updateNotificationsSelectedAtom = atom(null, (_get, set, selected: boolean) => {
  set(notificationDrawerDataAtom, (prev) => prev.map((notification) => ({ ...notification, selected })));
});

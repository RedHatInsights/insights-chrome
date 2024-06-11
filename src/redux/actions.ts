import * as actionTypes from './action-types';
import { getAllSIDs, getAllTags, getAllWorkloads } from '../components/GlobalFilter/tagsApi';
import type { TagFilterOptions, TagPagination } from '../components/GlobalFilter/tagsApi';
import type { ChromeUser } from '@redhat-cloud-services/types';
import type { FlagTagsFilter, NavDOMEvent, NavItem, Navigation } from '../@types/types';
import type { AccessRequest, NotificationData, NotificationsPayload } from './store';
import type { QuickStart } from '@patternfly/quickstarts';

export function userLogIn(user: ChromeUser | boolean) {
  return {
    type: actionTypes.USER_LOGIN,
    payload: user,
  };
}

export type AppNavClickItem = { id?: string; custom?: boolean };

/*
 *TODO: The event type is deliberately nonse. It will start failing once we mirate rest of the app and we will figure out the correct type
 */
export function appNavClick(item: AppNavClickItem, event?: NavDOMEvent) {
  return { type: actionTypes.APP_NAV_CLICK, payload: { ...(item || {}), id: item?.id, event } };
}

export function appAction(action: string) {
  return { type: actionTypes.CHROME_PAGE_ACTION, payload: action };
}

export function appObjectId(objectId: string) {
  return { type: actionTypes.CHROME_PAGE_OBJECT, payload: objectId };
}

export function fetchAllTags(filters?: TagFilterOptions, pagination?: TagPagination) {
  return {
    type: actionTypes.CHROME_GET_ALL_TAGS,
    payload: getAllTags(filters, pagination),
  };
}

export function fetchAllSIDs(filters?: TagFilterOptions, pagination?: TagPagination) {
  return {
    type: actionTypes.CHROME_GET_ALL_SIDS,
    payload: getAllSIDs(filters, pagination),
  };
}

export function fetchAllWorkloads(filters?: TagFilterOptions, pagination?: TagPagination) {
  return {
    type: actionTypes.CHROME_GET_ALL_WORKLOADS,
    payload: getAllWorkloads(filters, pagination),
  };
}

export function globalFilterScope(scope: string) {
  return {
    type: actionTypes.GLOBAL_FILTER_SCOPE,
    payload: scope,
  };
}

export function globalFilterChange(selectedTags: FlagTagsFilter) {
  return {
    type: actionTypes.GLOBAL_FILTER_UPDATE,
    payload: selectedTags,
  };
}

export function toggleGlobalFilter(isHidden = true) {
  return {
    type: actionTypes.GLOBAL_FILTER_TOGGLE,
    payload: { isHidden },
  };
}

export function removeGlobalFilter(isHidden = true) {
  return {
    type: actionTypes.GLOBAL_FILTER_REMOVE,
    payload: { isHidden },
  };
}

export const loadNavigationLandingPage = (schema: NavItem[]) => ({
  type: actionTypes.LOAD_NAVIGATION_LANDING_PAGE,
  payload: schema,
});

export const loadLeftNavSegment = (schema: Navigation, segment: string, pathName: string, shouldMerge?: boolean) => ({
  type: actionTypes.LOAD_LEFT_NAVIGATION_SEGMENT,
  payload: {
    segment,
    schema,
    pathName,
    shouldMerge,
  },
});

/**
 * @deprecated
 */
export const onToggle = () => ({
  type: 'NAVIGATION_TOGGLE',
});

export const toggleDebuggerModal = (payload: boolean) => ({
  type: actionTypes.TOGGLE_DEBUGGER_MODAL,
  payload,
});

export const toggleDebuggerButton = (payload: boolean) => ({
  type: actionTypes.TOGGLE_DEBUGGER_BUTTON,
  payload,
});

export const updateAccessRequestsNotifications = (payload: { count: number; data: AccessRequest[] }) => ({
  type: actionTypes.UPDATE_ACCESS_REQUESTS_NOTIFICATIONS,
  payload,
});

export const markAccessRequestNotification = (payload: string | number) => ({
  type: actionTypes.MARK_REQUEST_NOTIFICATION_SEEN,
  payload,
});

export const populateQuickstartsCatalog = (app: string, quickstarts: QuickStart[]) => ({
  type: actionTypes.POPULATE_QUICKSTARTS_CATALOG,
  payload: {
    app,
    quickstarts,
  },
});

export const addQuickstart = (app: string, quickstart: QuickStart) => ({
  type: actionTypes.ADD_QUICKSTARTS_TO_APP,
  payload: {
    app,
    quickstart,
  },
});

export const clearQuickstarts = (activeQuickstart?: string) => ({
  type: actionTypes.CLEAR_QUICKSTARTS,
  payload: {
    activeQuickstart,
  },
});

export const disableQuickstarts = () => ({
  type: actionTypes.DISABLE_QUICKSTARTS,
});

export const updateDocumentTitle = (title: string) => ({
  type: actionTypes.UPDATE_DOCUMENT_TITLE_REDUCER,
  payload: title,
});

export const markActiveProduct = (product?: string) => ({
  type: actionTypes.MARK_ACTIVE_PRODUCT,
  payload: product,
});

export const toggleNotificationsDrawer = () => ({
  type: actionTypes.TOGGLE_NOTIFICATIONS_DRAWER,
});

export const populateNotifications = (data: NotificationData[]) => ({ type: actionTypes.POPULATE_NOTIFICATIONS, payload: { data } });

export const markNotificationAsRead = (id: string) => ({
  type: actionTypes.MARK_NOTIFICATION_AS_READ,
  payload: id,
});

export const markNotificationAsUnread = (id: string) => ({
  type: actionTypes.MARK_NOTIFICATION_AS_UNREAD,
  payload: id,
});

export const markAllNotificationsAsRead = () => ({
  type: actionTypes.MARK_ALL_NOTIFICATION_AS_READ,
});

export const markAllNotificationsAsUnread = () => ({
  type: actionTypes.MARK_ALL_NOTIFICATION_AS_UNREAD,
});

export const updateNotifications = (payload: NotificationsPayload) => ({
  type: actionTypes.UPDATE_NOTIFICATIONS,
  payload,
});

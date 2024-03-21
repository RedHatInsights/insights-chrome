import { QuickStart } from '@patternfly/quickstarts';
import { ChromeUser } from '@redhat-cloud-services/types';
import { REQUESTS_COUNT, REQUESTS_DATA } from '../utils/consts';
import { NavItem, Navigation } from '../@types/types';
import { ITLess, highlightItems, levelArray } from '../utils/common';
import { ThreeScaleError } from '../utils/responseInterceptors';
import { AccessRequest, ChromeState, NotificationData, NotificationsPayload } from './store';

export function appNavClick(state: ChromeState, { payload }: { payload: { id: string } }): ChromeState {
  return {
    ...state,
    activeApp: payload.id,
  };
}

export function loginReducer(state: ChromeState, { payload }: { payload: ChromeUser }): ChromeState {
  const missingIDP = ITLess() && !Object.prototype.hasOwnProperty.call(payload?.identity, 'idp');
  return {
    ...state,
    missingIDP,
  };
}

export function onPageAction(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    pageAction: payload,
  };
}

export function onPageObjectId(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    pageObjectId: payload,
  };
}

export function loadNavigationLandingPageReducer(state: ChromeState, { payload }: { payload: NavItem[] }): ChromeState {
  return {
    ...state,
    navigation: {
      ...state.navigation,
      landingPage: payload,
    },
  };
}

function isNavigation(nav?: Navigation | NavItem[]): nav is Navigation {
  return !Array.isArray(nav);
}

export function loadNavigationSegmentReducer(
  state: ChromeState,
  {
    payload: { segment, schema, pathName, shouldMerge },
  }: {
    payload: {
      segment: string;
      schema: Navigation;
      pathName: string;
      shouldMerge?: boolean;
    };
  }
): ChromeState {
  const mergedSchema = shouldMerge || !state.navigation?.[segment] ? schema : state.navigation?.[segment];
  if (isNavigation(mergedSchema)) {
    // Landing page navgation has different siganture
    const sortedLinks = levelArray(mergedSchema?.navItems).sort((a, b) => (a.length < b.length ? 1 : -1));
    return {
      ...state,
      navigation: {
        ...state.navigation,
        [segment]: {
          ...mergedSchema,
          navItems: pathName ? highlightItems(pathName, mergedSchema.navItems, sortedLinks) : mergedSchema.navItems,
          sortedLinks,
        },
      },
    };
  }
  return state;
}

export function setPendoFeedbackFlag(
  state: ChromeState,
  {
    payload,
  }: {
    payload: boolean;
  }
): ChromeState {
  return {
    ...state,
    usePendoFeedback: payload,
  };
}

export function toggleFeedbackModal(
  state: ChromeState,
  {
    payload,
  }: {
    payload: boolean;
  }
): ChromeState {
  return {
    ...state,
    isFeedbackModalOpen: payload,
  };
}

export function toggleDebuggerModal(
  state: ChromeState,
  {
    payload,
  }: {
    payload: boolean;
  }
): ChromeState {
  return {
    ...state,
    isDebuggerModalOpen: payload,
  };
}

export function toggleDebuggerButton(
  state: ChromeState,
  {
    payload,
  }: {
    payload: boolean;
  }
): ChromeState {
  return {
    ...state,
    isDebuggerEnabled: payload,
  };
}

export function accessRequestsNotificationsReducer(
  state: ChromeState,
  { payload: { count, data } }: { payload: { count: number; data: AccessRequest[] } }
): ChromeState {
  const newData = data.map(({ request_id, created, seen }) => ({
    request_id,
    created,
    seen: seen === true || !!state.accessRequests.data.find((item) => request_id === item.request_id)?.seen || false,
  }));
  localStorage.setItem(REQUESTS_COUNT, newData.length.toString());
  localStorage.setItem(REQUESTS_DATA, JSON.stringify(newData));
  return {
    ...state,
    accessRequests: {
      ...state.accessRequests,
      count,
      hasUnseen: newData.length > 0,
      data: newData,
    },
  };
}

export function markAccessRequestRequestReducer(state: ChromeState, { payload }: { payload: string }): ChromeState {
  const newData = state.accessRequests.data.map((item) => (item.request_id === payload ? { ...item, seen: true } : item));
  localStorage.setItem(REQUESTS_DATA, JSON.stringify(newData));
  return {
    ...state,
    accessRequests: {
      ...state.accessRequests,
      hasUnseen: newData.length > 0,
      data: newData,
    },
  };
}

export function populateQuickstartsReducer(
  state: ChromeState,
  { payload: { app, quickstarts } }: { payload: { app: string; quickstarts: QuickStart[] } }
): ChromeState {
  return {
    ...state,
    quickstarts: {
      ...state.quickstarts,
      quickstarts: {
        [app]: quickstarts,
      },
    },
  };
}

export function addQuickstartstoApp(state: ChromeState, { app, quickstart }: { app: string; quickstart: QuickStart }) {
  return {
    ...state,
    quickstarts: {
      ...state.quickstarts,
      quickstarts: {
        ...state.quickstarts.quickstarts,
        [app]: [...(state.quickstarts?.quickstarts?.[app] ? state.quickstarts?.quickstarts?.[app] || [] : []), quickstart],
      },
    },
  };
}

export function disableQuickstartsReducer(state: ChromeState): ChromeState {
  return {
    ...state,
    quickstarts: {
      ...state.quickstarts,
      disabled: true,
    },
  };
}

export function clearQuickstartsReducer(
  state: ChromeState,
  { payload: { activeQuickstart } }: { payload: { activeQuickstart?: string } }
): ChromeState {
  return {
    ...state,
    quickstarts: {
      ...state.quickstarts,
      // do not remove currently opened quickstart
      quickstarts: Object.entries(state.quickstarts.quickstarts)?.reduce(
        (acc, [namespace, quickstarts]) => ({
          ...acc,
          [namespace]: Array.isArray(quickstarts) ? quickstarts.filter((qs) => qs?.metadata?.name === activeQuickstart) : quickstarts,
        }),
        {}
      ),
    },
  };
}

export function documentTitleReducer(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    documentTitle: payload,
  };
}

export function markActiveProduct(state: ChromeState, { payload }: { payload?: string }): ChromeState {
  return {
    ...state,
    activeProduct: payload,
  };
}

export function setGatewayError(state: ChromeState, { payload }: { payload?: ThreeScaleError }): ChromeState {
  return {
    ...state,
    gatewayError: payload,
  };
}

export function toggleNotificationsReducer(state: ChromeState) {
  return {
    ...state,
    notifications: {
      ...state.notifications,
      data: state.notifications?.data || [],
      isExpanded: !state.notifications?.isExpanded,
    },
  };
}

export function populateNotificationsReducer(state: ChromeState, { payload: { data } }: { payload: { data: NotificationData[] } }) {
  return {
    ...state,
    notifications: {
      ...state.notifications,
      data,
    },
  };
}

export function markNotificationAsRead(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    notifications: {
      isExpanded: state.notifications?.isExpanded || false,
      count: state.notifications?.data?.length || 0,
      data: (state.notifications?.data || []).map((notification: NotificationData) =>
        notification.id === payload ? { ...notification, read: true } : notification
      ),
    },
  };
}

export function markNotificationAsUnread(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    notifications: {
      isExpanded: state.notifications?.isExpanded || false,
      count: state.notifications?.data?.length || 0,
      data: (state.notifications?.data || []).map((notification: NotificationData) =>
        notification.id === payload ? { ...notification, read: false } : notification
      ),
    },
  };
}

export function markAllNotificationsAsRead(state: ChromeState): ChromeState {
  return {
    ...state,
    notifications: {
      isExpanded: state.notifications?.isExpanded || false,
      count: state.notifications?.count || 0,
      data: (state.notifications?.data || []).map((notification) => ({ ...notification, read: true })),
    },
  };
}

export function markAllNotificationsAsUnread(state: ChromeState): ChromeState {
  return {
    ...state,
    notifications: {
      isExpanded: state.notifications?.isExpanded || false,
      count: state.notifications?.data?.length || 0,
      data: (state.notifications?.data || []).map((notification) => ({ ...notification, read: false })),
    },
  };
}

export function updateNotificationsReducer(state: ChromeState, { payload }: { payload: NotificationsPayload }) {
  return {
    ...state,
    notifications: {
      ...state.notifications,
      data: [...state.notifications.data, payload.data],
    },
  };
}

import axios from 'axios';
import { initializeVisibilityFunctions } from './VisibilitySingleton';
import createGetUserPermissions from '../auth/createGetUserPermissions';
import { ChromeUser } from '@redhat-cloud-services/types';

export type ChromeUserConfig = {
  data: {
    uiPreview: boolean;
    uiPreviewSeen: boolean;
  };
};

/**
 * Initialize the chrome visibility functions independently of the user config fetch.
 * The user personalization API (`/api/chrome-service/v1/user`) must be optional, so the
 * visibility functions have to be available as soon as auth is ready — even if the config
 * fetch fails. `isPreview` is the current preview value: auth bootstrap may already have hydrated
 * it, and later changes are applied via `updateVisibilityFunctionsBeta()` (triggered by `isPreviewAtom`).
 */
export const initVisibilityFunctions = ({
  getUser,
  getToken,
  isPreview = false,
}: {
  getUser: () => Promise<ChromeUser>;
  getToken: () => Promise<string>;
  isPreview?: boolean;
}) => {
  initializeVisibilityFunctions({
    getUser,
    getToken,
    getUserPermissions: createGetUserPermissions(getUser, getToken),
    isPreview,
  });
};

// Bound the personalization fetch so a hung request cannot block shell init indefinitely. On
// timeout axios rejects with `ECONNABORTED`, which flows into useSessionConfig's degraded branch
// (it is not a 3scale gateway error) and renders the shell with defaults instead of hanging.
const USER_CONFIG_TIMEOUT_MS = 5000;

export const initChromeUserConfig = async () => {
  const { data } = await axios.get<ChromeUserConfig>('/api/chrome-service/v1/user', {
    params: {
      'skip-identity-cache': 'true',
    },
    timeout: USER_CONFIG_TIMEOUT_MS,
  });

  return data;
};

let userConfigPromise: Promise<ChromeUserConfig> | undefined;

/**
 * Fetch the user config once per page load. Auth bootstrap needs the preview preference before its
 * rollout lookup, and useSessionConfig needs the same response afterwards; both share this request,
 * including its rejection.
 */
export const loadChromeUserConfigOnce = () => {
  userConfigPromise ??= initChromeUserConfig();
  return userConfigPromise;
};

/** Test helper: forget the shared request. */
export const resetChromeUserConfigOnce = () => {
  userConfigPromise = undefined;
};

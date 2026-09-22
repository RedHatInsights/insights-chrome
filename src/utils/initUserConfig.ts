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
 * fetch fails. `isPreview` defaults to `false`; the real value is applied later via
 * `updateVisibilityFunctionsBeta()` (triggered by `isPreviewAtom`) once the config loads.
 */
export const initVisibilityFunctions = ({ getUser, getToken }: { getUser: () => Promise<ChromeUser>; getToken: () => Promise<string> }) => {
  initializeVisibilityFunctions({
    getUser,
    getToken,
    getUserPermissions: createGetUserPermissions(getUser, getToken),
    isPreview: false,
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

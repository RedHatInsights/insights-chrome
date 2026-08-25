import { ITLess } from './common';
import { ChromeAuthOptions, GenericCB } from '../@types/types';
import { Listener } from '@redhat-cloud-services/frontend-components-utilities/MiddlewareListener';

export const noAuthParam = 'noauth';
export const offlineToken = '2402500adeacc30eb5c5a8a5e2e0ec1f';

/**
 * OIDC-reserved parameters that must never be forwarded to Red Hat SSO inside an
 * outgoing `redirect_uri`. SSO rejects authorization requests whose redirect_uri
 * contains any of these (they are meant to appear only on the callback URL SSO
 * returns to us). They can leak into `location.href` via the back button, a
 * copy-pasted URL, or an interrupted auth cycle, so we strip them before building
 * a redirect_uri. See `sanitizeRedirectUri` in src/auth/OIDCConnector/utils.ts.
 */
export const OIDC_RESERVED_PARAMS = [
  'access_token',
  'code',
  'error',
  'error_description',
  'expires_in',
  'id_token',
  'iss',
  'kc_action',
  'kc_action_status',
  'response',
  'session_state',
  'state',
  'token_type',
] as const;
export const GLOBAL_FILTER_KEY = 'chrome:global-filter';
export const GLOBAL_FILTER_UPDATE = 'GLOBAL_FILTER_UPDATE';
export const HYDRA_ENDPOINT = '/hydra/rest/se/sessions';
export const isITLessEnv = ITLess();
/**
 * Keys for storing acess reqeusts data
 */
export const REQUESTS_COUNT = 'chrome:cross-account-requests:pending:count';
export const REQUESTS_DATA = 'chrome:cross-account-requests:pending:data';
export const ACTIVE_ACCOUNT_SWITCH_NOTIFICATION = 'chrome:cross-account-requests:active-notification';
export const ACCOUNT_REQUEST_TIMEOUT = 'chrome:cross-account-requests:request-timeout';
export const CROSS_ACCESS_ACCOUNT_NUMBER = 'cross_access_account_number';
export const ACTIVE_REMOTE_REQUEST = 'chrome/active-remote-request';
export const CROSS_ACCESS_ORG_ID = 'cross_access_org_id';
export const REFRESH_KEY = 'refresh_key';
export const ACCESS_KEY = 'access_key';

const obj = {
  noAuthParam,
  offlineToken,
};

export const isVisible = (limitedApps?: string[], app?: string, visibility?: Record<string, unknown>) => {
  if (limitedApps && app && limitedApps.includes(app)) {
    if (visibility instanceof Object) {
      return Boolean(visibility[app]);
    }

    return visibility;
  }

  return true;
};

export default Object.freeze(obj);

export const activationRequestURLs = [
  'azure-openshift-activation',
  'azure-ocp-activation',
  'azure-oke-activation',
  'azure-opp-activation',
  'azure-ansible-activation',
  'azure-eap-activation',
  'azure-sap-activation',
  'azure-rhel-activation',
  'aws-openshift-activation',
  'aws-ocp-activation',
  'aws-oke-activation',
  'aws-opp-activation',
  'gcp-opp-activation',
  'gcp-oke-activation',
  'gcp-ocp-activation',
  'gcp-rhaap2-activation',
  'gcp-rhaap2-ext100-activation',
  'gcp-rhaap2-ext200-activation',
  'gcp-rhaap2-ext400-activation',
];

// Global Defaults
export const defaultAuthOptions: ChromeAuthOptions = {
  realm: 'redhat-external',
  clientId: ITLess() ? 'console-dot' : 'cloud-services',
  cookieName: 'cs_jwt',
};

export const OFFLINE_REDIRECT_STORAGE_KEY = 'chrome.offline.redirectUri';

// Platform Content Analytics team will be unable to track user analytics without this local storage key set
export const RH_USER_ID_STORAGE_KEY = 'rh_user_id';

export const PUBLIC_EVENTS: {
  NAVIGATION_TOGGLE: [(callback: GenericCB) => Listener];
  GLOBAL_FILTER_UPDATE: [(callback: GenericCB) => Listener, string];
} = {
  NAVIGATION_TOGGLE: [
    (callback: (...args: unknown[]) => void) => {
      console.error('NAVIGATION_TOGGLE event is deprecated and will be removed in future versions of chrome.');
      return {
        on: 'NAVIGATION_TOGGLE',
        callback,
      };
    },
  ],
  GLOBAL_FILTER_UPDATE: [
    (callback: (...args: unknown[]) => void) => ({
      on: GLOBAL_FILTER_UPDATE,
      callback,
    }),
    'globalFilter.selectedTags',
  ],
};

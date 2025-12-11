import { ChromeAPI } from '@redhat-cloud-services/types';
import { isProd } from './common';
import cookie from 'js-cookie';
import axios, { AxiosRequestConfig } from 'axios';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { getSharedScope, initSharedScope } from '@scalprum/core';
import { getFeatureFlagsError, getUnleashClient } from '../components/FeatureFlags/unleashClient';

const matcherMapper = {
  isEmpty,
  isNotEmpty: (value: any) => !isEmpty(value),
};

const matchValue = (value: any, matcher?: keyof typeof matcherMapper) => {
  const match = matcherMapper[matcher!];
  return typeof match === 'function' ? match(value) : value;
};

const getValue = (response = {}, accessor: string) => {
  return get(response || {}, accessor) || get(response || {}, `data.${accessor}`);
};

const initialize = ({
  getUserPermissions,
  getUser,
  getToken,
  isPreview,
}: {
  getUser: ChromeAPI['auth']['getUser'];
  getToken: ChromeAPI['auth']['getToken'];
  getUserPermissions: ChromeAPI['getUserPermissions'];
  isPreview: boolean;
}) => {
  /**
   * Check if is permitted to see navigation link
   * @param {array} permissions array checked user permissions
   * @param {every|some} require type of permissions requirement
   * @returns {boolean}
   */
  const checkPermissions = async (permissions: string[] = [], require: 'every' | 'some' = 'every') => {
    const userPermissions = await getUserPermissions();
    return userPermissions && permissions[require] && permissions[require]((item) => userPermissions.find(({ permission }) => permission === item));
  };

  const visibilityFunctions = {
    isOrgAdmin: async () => {
      const data = await getUser();
      try {
        return !!data?.identity.user?.is_org_admin;
      } catch {
        return false;
      }
    },
    isActive: async () => {
      const data = await getUser();
      try {
        return !!data?.identity.user?.is_active;
      } catch {
        return false;
      }
    },
    isInternal: async () => {
      const data = await getUser();
      try {
        return !!data?.identity.user?.is_internal;
      } catch {
        return false;
      }
    },
    isEntitled: async (appName?: string) => {
      const data = await getUser();
      const baseEntitlements: {
        [key: string]: {
          is_entitled: boolean;
          is_trial: boolean;
        };
      } = {};
      const { entitlements } = data || { entitlements: baseEntitlements };
      return data?.entitlements && appName
        ? Boolean(entitlements[appName] && entitlements[appName].is_entitled)
        : Object.entries(entitlements || {}).reduce((acc, [key, { is_entitled }]) => ({ ...acc, [key]: is_entitled }), {});
    },
    isProd: () => isProd(),
    /**
     * @deprecated Should use feature flags instead
     * @returns {boolean}
     */
    isBeta: () => isPreview,
    isHidden: () => true, // FIXME: Why always true?
    withEmail: async (...toHave: string[]) => {
      const data = await getUser();
      const {
        identity: { user },
      } = data || { identity: {} };
      return toHave?.some((item) => user?.email?.includes(item));
    },
    loosePermissions: (permissions: string[]) => checkPermissions(permissions, 'some'),
    hasPermissions: checkPermissions,
    hasLocalStorage: (key: string, value: unknown) => localStorage.get(key) === value,
    hasCookie: (cookieKey: string, cookieValue: string) => cookie.get(cookieKey) === cookieValue,
    apiRequest: async ({
      url,
      method = 'GET',
      accessor,
      matcher,
      ...options
    }: Omit<AxiosRequestConfig, 'adapter'> & { accessor?: string; matcher?: keyof typeof matcherMapper }) => {
      const data = await getUser();

      const token = await getToken();
      // this will log a bunch of 403s if the account number isn't present
      if (data?.identity.org_id) {
        return axios({
          url,
          method,
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
        })
          .then((response) => matchValue(accessor ? getValue(response, accessor) : response, matcher))
          .catch(() => {
            console.log('Unable to retrieve visibility result', { visibilityMethod: 'apiRequest', method, url });
            return false;
          });
      } else {
        console.log('Unable to call API, no account number');
        return false;
      }
    },
    featureFlag: (flagName: string, expectedValue: boolean) => getFeatureFlagsError() !== true && getUnleashClient()?.isEnabled(flagName) === expectedValue,
  };

  // in order to properly distribute the module, it has be added to the webpack share scope to avoid reference issues if these functions are called from chrome shared modules
  initSharedScope();
  const scope = getSharedScope();
  scope['@chrome/visibilityFunctions'] = {
    '*': {
      loaded: 1,
      get: () => visibilityFunctions,
    },
  };
};

export const getVisibilityFunctions = () => {
  const visibilityFunctions = getSharedScope()['@chrome/visibilityFunctions'];
  if (!visibilityFunctions) {
    throw new Error('Visibility functions were not initialized! Call the initialized function first.');
  }

  return visibilityFunctions['*'].get();
};

export const visibilityFunctionsExist = () => !!getSharedScope()['@chrome/visibilityFunctions'];

export const updateVisibilityFunctionsBeta = (isPreview: boolean) => {
  const visibilityFunctions = getVisibilityFunctions();
  visibilityFunctions.isBeta = () => isPreview;
};

export const initializeVisibilityFunctions = initialize;

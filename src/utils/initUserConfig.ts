import axios from 'axios';
import { isBeta } from './common';
import { initializeVisibilityFunctions } from './VisibilitySingleton';
import createGetUserPermissions from '../auth/createGetUserPermissions';
import { ChromeUser } from '@redhat-cloud-services/types';

export type ChromeUserConfig = {
  data: {
    uiPreview: boolean;
  };
};

export const initChromeUserConfig = async ({ getUser, token }: { getUser: () => Promise<ChromeUser>; token: string }) => {
  const LOCAL_PREVIEW = localStorage.getItem('chrome:local-preview') === 'true';
  let config: ChromeUserConfig;
  if (!LOCAL_PREVIEW) {
    config = {
      data: {
        uiPreview: isBeta(),
      },
    };
  } else {
    const { data } = await axios.get<ChromeUserConfig>('/api/chrome-service/v1/user', {
      params: {
        'skip-identity-cache': 'true',
      },
    });
    config = data;
  }

  initializeVisibilityFunctions({
    getUser,
    getToken: () => Promise.resolve(token),
    getUserPermissions: createGetUserPermissions(getUser, () => Promise.resolve(token)),
    isPreview: config.data.uiPreview,
  });

  return config;
};

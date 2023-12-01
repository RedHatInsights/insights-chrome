import { ChromeUser } from '@redhat-cloud-services/types';
import { AxiosResponse } from 'axios';
import { createContext } from 'react';
import { OfflineTokenResponse } from './offline';

export type ChromeAuthContextValue<LoginResponse = void> = {
  ready: boolean;
  user: ChromeUser;
  getUser: () => Promise<ChromeUser>;
  token: string;
  logoutAllTabs: (bounce?: boolean) => void;
  loginAllTabs: () => void;
  logout: () => void;
  login: (requiredScopes?: string[]) => Promise<LoginResponse>;
  tokenExpires: number;
  getToken: () => Promise<string>;
  getRefreshToken: () => Promise<string>;
  postbackUrl?: string;
  getOfflineToken: () => Promise<AxiosResponse<OfflineTokenResponse>>;
  doOffline: () => Promise<void>;
};

const blankUser: ChromeUser = {
  entitlements: {},
  identity: {
    org_id: '',
    type: '',
  },
};

const ChromeAuthContext = createContext<ChromeAuthContextValue>({
  ready: false,
  logoutAllTabs: () => undefined,
  loginAllTabs: () => undefined,
  logout: () => undefined,
  login: () => Promise.resolve(),
  getToken: () => Promise.resolve(''),
  getRefreshToken: () => Promise.resolve(''),
  getOfflineToken: () =>
    Promise.resolve({
      data: {},
    } as AxiosResponse<OfflineTokenResponse>),
  doOffline: () => Promise.resolve(),
  getUser: () => Promise.resolve(blankUser),
  token: '',
  tokenExpires: 0,
  user: blankUser,
});

export default ChromeAuthContext;

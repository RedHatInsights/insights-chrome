import { ChromeUser } from '@redhat-cloud-services/types';
import { AxiosResponse } from 'axios';
import { createContext } from 'react';
import { OfflineTokenResponse } from './offline';

export type ChromeLogin<LoginResponse = void> = (requiredScopes?: string[]) => Promise<LoginResponse>;

export type ChromeAuthContextValue<LoginResponse = void> = {
  ssoUrl: string;
  ready: boolean;
  user: ChromeUser;
  getUser: () => Promise<ChromeUser>;
  token: string;
  refreshToken: string;
  logoutAllTabs: (bounce?: boolean) => void;
  loginAllTabs: () => void;
  logout: () => void;
  login: ChromeLogin<LoginResponse>;
  tokenExpires: number;
  getToken: () => Promise<string>;
  getRefreshToken: () => Promise<string>;
  postbackUrl?: string;
  getOfflineToken: () => Promise<AxiosResponse<OfflineTokenResponse>>;
  doOffline: () => Promise<void>;
  reAuthWithScopes: (...scopes: string[]) => Promise<void>;
  forceRefresh: () => Promise<unknown>;
  loginSilent: () => Promise<void>;
};

const blankUser: ChromeUser = {
  entitlements: {},
  identity: {
    org_id: '',
    type: '',
  },
};

const ChromeAuthContext = createContext<ChromeAuthContextValue>({
  ssoUrl: '',
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
  refreshToken: '',
  tokenExpires: 0,
  user: blankUser,
  reAuthWithScopes: () => Promise.resolve(),
  forceRefresh: () => Promise.resolve(),
  loginSilent: () => Promise.resolve(),
});

export default ChromeAuthContext;

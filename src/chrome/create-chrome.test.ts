import { initializeVisibilityFunctions } from '../utils/VisibilitySingleton';
import { createChromeContext } from './create-chrome';
import { ChromeUser } from '@redhat-cloud-services/types';
import { ChromeAuthContextValue } from '../auth/ChromeAuthContext';
import { AxiosResponse } from 'axios';
import { OfflineTokenResponse } from '../auth/offline';
import { AnalyticsBrowser } from '@segment/analytics-next';
import QuickStartCatalog from '../components/QuickStart/QuickStartCatalog';

jest.mock('@scalprum/core', () => {
  return {
    __esModule: true,
    initSharedScope: jest.fn(),
    getSharedScope: jest.fn().mockReturnValue({}),
  };
});

jest.mock('../auth/fetchPermissions');

const mockUser: ChromeUser = {
  entitlements: {},
  identity: {
    org_id: '1234',
    type: 'User',
    account_number: '1234',
    user: {
      is_active: true,
      is_org_admin: true,
      is_internal: true,
      locale: 'en_US',
      username: 'test-user',
      email: '',
      first_name: 'John',
      last_name: 'Doe',
    },
  },
};

describe('create chrome', () => {
  const chromeAuthMock: ChromeAuthContextValue = {
    ssoUrl: '',
    doOffline() {
      return Promise.resolve();
    },
    getOfflineToken() {
      return Promise.resolve({
        data: {
          access_token: 'string',
          expires_in: 0,
          id_token: 'string',
          'not-before-policy': 0,
          refresh_expires_in: 0,
          refresh_token: 'string',
          scope: 'string',
          session_state: 'string',
          token_type: 'string',
        },
      } as AxiosResponse<OfflineTokenResponse>);
    },
    getToken() {
      return Promise.resolve('string');
    },
    getRefreshToken() {
      return Promise.resolve('string');
    },
    getUser() {
      return Promise.resolve(mockUser);
    },
    reAuthWithScopes() {
      return Promise.resolve();
    },
    login() {
      return Promise.resolve();
    },
    loginAllTabs() {
      return;
    },
    logout() {
      return;
    },
    logoutAllTabs() {
      return;
    },
    ready: true,
    token: 'string',
    refreshToken: 'string',
    tokenExpires: 0,
    user: mockUser,
    forceRefresh() {
      return Promise.resolve();
    },
    loginSilent: () => {
      return Promise.resolve();
    },
  };

  const chromeContextOptionsMock = {
    addWsEventListener: jest.fn(),
    // getUser: () => Promise.resolve(mockUser),
    chromeAuth: chromeAuthMock,
    analytics: new AnalyticsBrowser(),
    helpTopics: {
      addHelpTopics: jest.fn(),
      closeHelpTopic: jest.fn(),
      disableTopics: jest.fn(),
      enableTopics: jest.fn(),
      setActiveTopic: jest.fn(),
    },
    isPreview: false,
    quickstartsAPI: {
      Catalog: QuickStartCatalog,
      set() {
        return;
      },
      toggle() {
        return;
      },
      activateQuickstart() {
        return Promise.resolve();
      },
      version: 2,
    },
    setPageMetadata: jest.fn(),
    useGlobalFilter: jest.fn(),
    registerModule: jest.fn(),
    addNavListener: jest.fn(),
    deleteNavListener: jest.fn(),
  };
  beforeAll(() => {
    const mockAuthMethods = {
      getUser: () => Promise.resolve(mockUser),
      getToken: () => Promise.resolve('mocked-token'),
      getUserPermissions: () => Promise.resolve([]),
      isPreview: false,
    };
    initializeVisibilityFunctions(mockAuthMethods);
  });

  it('should create chrome instance', () => {
    const chrome = createChromeContext(chromeContextOptionsMock);
    expect(chrome).toEqual(expect.any(Object));
  });

  it('should postpone getUserPermissions resolve, after chrome cache is initialized', async () => {
    const promiseSpy = jest.fn();
    expect.assertions(1);
    const { getUserPermissions } = createChromeContext(chromeContextOptionsMock);
    await getUserPermissions(promiseSpy as unknown as string);
    expect(promiseSpy).toHaveBeenCalledWith('mocked-user-permissions');
  });
});

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import axios from 'axios';
import * as Sentry from '@sentry/react';
import { ChromeUser } from '@redhat-cloud-services/types';
import { BundleNavigation, NavItem } from '../../@types/types';
import { AllServicesSection } from '../../components/AllServices/allServicesLinks';
import ConfigCacheDegradedStateBridge from '../../components/ConfigCacheDegradedStateBridge/ConfigCacheDegradedStateBridge';
import { initializeVisibilityFunctions } from '../../utils/VisibilitySingleton';
import { CACHE_SCHEMA_VERSION } from '../../utils/cacheFetch';
import { CONFIG_SOURCES, resetConfigCacheStatus } from '../../utils/configCacheStatus';
import { degradedStateAtom, isAnyServiceDegradedAtom } from './degradedStateAtom';
import {
  useInitVisibleBundles,
  visibleBundlesAtom,
  visibleBundlesErrorAtom,
  visibleBundlesReadyAtom,
  visibleServiceTilesAtom,
  visibleServiceTilesErrorAtom,
  visibleServiceTilesReadyAtom,
} from './visibleBundlesAtom';

let mockCacheEnabled = true;
let mockFlagsError = false;
let mockFeo = true;
const mockSetItem = jest.fn();
const mockGetItem = jest.fn();

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@sentry/react', () => ({ captureMessage: jest.fn() }));
jest.mock('@scalprum/core', () => ({ initSharedScope: jest.fn(), getSharedScope: jest.fn().mockReturnValue({}) }));
jest.mock('@unleash/proxy-client-react', () => ({
  useFlagsStatus: () => ({ flagsReady: true, flagsError: mockFlagsError }),
  useFlag: () => mockFeo,
}));
jest.mock('../../components/FeatureFlags/unleashClient', () => ({
  getFeatureFlagsError: () => false,
  getUnleashClient: () => ({ isReady: () => true, isEnabled: () => mockCacheEnabled }),
  unleashClientExists: () => true,
}));
jest.mock('../../utils/common', () => ({ ITLess: () => false, getChromeStaticPathname: () => '/static' }));
jest.mock('../../components/AppFilter/useAppFilter', () => ({ itLessBundles: [], requiredBundles: ['settings'] }));
jest.mock('localforage', () => ({
  INDEXEDDB: 'asyncStorage',
  WEBSQL: 'webSQLStorage',
  LOCALSTORAGE: 'localStorageWrapper',
  createInstance: () => ({ setItem: mockSetItem, getItem: mockGetItem }),
}));

const user: ChromeUser = { identity: { account_number: '0', type: 'User', org_id: '123', user: { is_org_admin: true } } } as ChromeUser;
const storageKey = 'visibility-test';
const restrictedLink = {
  id: 'restricted',
  title: 'Restricted',
  href: '/settings/restricted',
  permissions: { method: 'hasLocalStorage', args: [storageKey, 'enabled'] },
} satisfies NavItem;

describe('visible bundle initialization with real visibility evaluation', () => {
  let store: ReturnType<typeof createStore>;
  let bundles: BundleNavigation[];
  let tiles: AllServicesSection[];
  const getUser = jest.fn();

  const mount = () =>
    renderHook(() => useInitVisibleBundles(), {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <ConfigCacheDegradedStateBridge />
          {children}
        </Provider>
      ),
    });

  const waitUntilReady = () =>
    waitFor(() => {
      expect(store.get(visibleBundlesReadyAtom)).toBe(true);
      expect(store.get(visibleServiceTilesReadyAtom)).toBe(true);
    });

  const blockStorage = () => {
    const getItem = localStorage.getItem.bind(localStorage);
    return jest.spyOn(localStorage, 'getItem').mockImplementation((key) => {
      if (key === storageKey) throw new DOMException('private storage data', 'SecurityError');
      return getItem(key);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    store = createStore();
    mockCacheEnabled = true;
    mockFlagsError = false;
    mockFeo = true;
    resetConfigCacheStatus();
    mockSetItem.mockReset().mockResolvedValue(undefined);
    mockGetItem.mockReset().mockResolvedValue(null);
    getUser.mockReset().mockResolvedValue(user);
    initializeVisibilityFunctions({ getUser, getToken: jest.fn(), getUserPermissions: jest.fn(), isPreview: false });
    localStorage.setItem(storageKey, 'enabled');
    bundles = [
      {
        id: 'settings',
        title: 'Settings',
        navItems: [{ id: 'group', groupId: 'group', navItems: [restrictedLink, { id: 'working', title: 'Working', href: '/settings/working' }] }],
      },
      { id: 'insights', title: 'Insights', navItems: [{ id: 'dashboard', title: 'Dashboard', href: '/insights/dashboard' }] },
    ];
    tiles = [{ title: 'Services', links: [{ isGroup: true, title: 'Group', links: [restrictedLink, { title: 'Working', href: '/working' }] }] }];
    jest
      .mocked(axios.get)
      .mockReset()
      .mockImplementation(async (url) => ({ data: url.includes('bundles-generated') ? bundles : tiles }));
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.removeItem(storageKey);
    resetConfigCacheStatus();
  });

  it.each([
    { enabled: false, cached: false },
    { enabled: true, cached: false },
    { enabled: true, cached: true },
  ])('isolates storage failures with cache enabled=$enabled, cached=$cached', async ({ enabled, cached }) => {
    mockCacheEnabled = enabled;
    blockStorage();
    if (cached) {
      jest.mocked(axios.get).mockRejectedValue({ response: { status: 503 } });
      mockGetItem.mockImplementation(async (key) => ({
        cachedAt: Date.now(),
        data: key === `v${CACHE_SCHEMA_VERSION}:${CONFIG_SOURCES.NAVIGATION}` ? bundles : tiles,
      }));
    }

    mount();
    await waitUntilReady();

    const visible = store.get(visibleBundlesAtom);
    expect(visible).toHaveLength(2);
    expect(visible[0].navItems[0].navItems?.map(({ id }) => id)).toEqual(['working']);
    expect(visible[1].navItems[0].id).toBe('dashboard');
    expect(store.get(visibleServiceTilesAtom)[0].links[0]).toMatchObject({ links: [{ title: 'Working' }] });
    expect(store.get(visibleBundlesErrorAtom)).toBe(false);
    expect(store.get(visibleServiceTilesErrorAtom)).toBe(false);
    expect(store.get(degradedStateAtom)).toMatchObject({ navigation: true, serviceTiles: true, configFromCache: cached });
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2);
    expect(bundles[0].navItems[0].navItems).toHaveLength(2);
    expect(restrictedLink).not.toHaveProperty('isHidden');
    if (!enabled) {
      expect(mockSetItem).not.toHaveBeenCalled();
      expect(mockGetItem).not.toHaveBeenCalled();
    }
  });

  it('treats ordinary permission denial as healthy', async () => {
    localStorage.removeItem(storageKey);
    mount();
    await waitUntilReady();

    expect(store.get(visibleBundlesAtom)[0].navItems[0].navItems).toHaveLength(1);
    expect(store.get(isAnyServiceDegradedAtom)).toBe(false);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('also isolates item failures when navigation is loaded from legacy configuration', async () => {
    mockFeo = false;
    blockStorage();
    jest.mocked(axios.get).mockImplementation(async (url) => ({ data: url.includes('navigation.json') ? bundles[0] : tiles }));
    mount();
    await waitUntilReady();

    expect(store.get(visibleBundlesAtom)[0].navItems[0].navItems?.map(({ id }) => id)).toEqual(['working']);
    expect(store.get(visibleBundlesErrorAtom)).toBe(false);
    expect(store.get(degradedStateAtom)).toMatchObject({ navigation: true, serviceTiles: true, configFromCache: false });
    expect(mockGetItem).not.toHaveBeenCalled();
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('recovers each source independently after a new evaluation', async () => {
    const storageSpy = blockStorage();
    const adminLink = { ...restrictedLink, permissions: { method: 'isOrgAdmin', args: [] } } satisfies NavItem;
    tiles = [{ title: 'Services', links: [adminLink] }];
    getUser.mockRejectedValue(new Error('user unavailable'));
    const { rerender } = mount();
    await waitUntilReady();
    expect(store.get(degradedStateAtom)).toMatchObject({ navigation: true, serviceTiles: true });

    storageSpy.mockRestore();
    mockFlagsError = true;
    rerender();
    await waitFor(() => expect(store.get(degradedStateAtom)).toMatchObject({ navigation: false, serviceTiles: true }));
    expect(store.get(isAnyServiceDegradedAtom)).toBe(true);

    getUser.mockResolvedValue(user);
    mockFlagsError = false;
    rerender();
    await waitFor(() => expect(store.get(isAnyServiceDegradedAtom)).toBe(false));
    expect(store.get(visibleServiceTilesAtom)[0].links).toHaveLength(1);
  });

  it('does not let an obsolete evaluation overwrite a newer healthy result', async () => {
    let rejectOldCheck!: (error: Error) => void;
    getUser.mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectOldCheck = reject)));
    bundles[0].navItems = [{ ...restrictedLink, permissions: { method: 'isOrgAdmin', args: [] } }];
    const { rerender } = mount();
    await waitFor(() => expect(getUser).toHaveBeenCalledTimes(1));

    mockFlagsError = true;
    rerender();
    await waitUntilReady();
    await act(async () => rejectOldCheck(new Error('obsolete failure')));

    expect(store.get(degradedStateAtom).navigation).toBe(false);
    expect(store.get(visibleBundlesErrorAtom)).toBe(false);
    expect(store.get(visibleBundlesAtom)[0].navItems).toHaveLength(1);
  });

  it('preserves the load-error behavior when configuration cannot be fetched and cache is disabled', async () => {
    mockCacheEnabled = false;
    jest.mocked(axios.get).mockRejectedValue(new Error('origin unavailable'));
    mount();
    await waitUntilReady();

    expect(store.get(visibleBundlesErrorAtom)).toBe(true);
    expect(store.get(visibleServiceTilesErrorAtom)).toBe(true);
    expect(mockGetItem).not.toHaveBeenCalled();
  });
});

import axios from 'axios';
import { ChromeUser } from '@redhat-cloud-services/types';
import { initChromeUserConfig, initVisibilityFunctions } from './initUserConfig';
import { initializeVisibilityFunctions } from './VisibilitySingleton';
import createGetUserPermissions from '../auth/createGetUserPermissions';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('./VisibilitySingleton', () => ({
  initializeVisibilityFunctions: jest.fn(),
}));

jest.mock('../auth/createGetUserPermissions', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

const mockedGet = jest.mocked(axios.get);
const mockedInitVisibility = jest.mocked(initializeVisibilityFunctions);
const mockedCreateGetUserPermissions = jest.mocked(createGetUserPermissions);

const getUser = jest.fn(() => Promise.resolve({} as ChromeUser));

describe('initUserConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initChromeUserConfig', () => {
    it('fetches the user config and returns it without initializing visibility functions', async () => {
      const config = { data: { uiPreview: true, uiPreviewSeen: false } };
      mockedGet.mockResolvedValueOnce({ data: config });

      const result = await initChromeUserConfig();

      expect(result).toEqual(config);
      // A timeout is set so a hung request cannot block shell init indefinitely.
      expect(mockedGet).toHaveBeenCalledWith('/api/chrome-service/v1/user', {
        params: { 'skip-identity-cache': 'true' },
        timeout: 5000,
      });
      // The visibility functions must be initialized independently of the fetch.
      expect(mockedInitVisibility).not.toHaveBeenCalled();
    });

    it('rejects when the request fails', async () => {
      mockedGet.mockRejectedValueOnce(new Error('500'));

      await expect(initChromeUserConfig()).rejects.toThrow('500');
      expect(mockedInitVisibility).not.toHaveBeenCalled();
    });

    it('rejects on request timeout (ECONNABORTED) so the caller can fall back to a degraded shell', async () => {
      mockedGet.mockRejectedValueOnce(Object.assign(new Error('timeout of 5000ms exceeded'), { code: 'ECONNABORTED' }));

      await expect(initChromeUserConfig()).rejects.toThrow('timeout of 5000ms exceeded');
      expect(mockedInitVisibility).not.toHaveBeenCalled();
    });
  });

  describe('initVisibilityFunctions', () => {
    it('initializes visibility functions with isPreview defaulting to false', async () => {
      const getToken = jest.fn(() => Promise.resolve('test-token'));
      initVisibilityFunctions({ getUser, getToken });

      expect(mockedCreateGetUserPermissions).toHaveBeenCalledTimes(1);
      // The live token getter is forwarded to createGetUserPermissions unchanged.
      expect(mockedCreateGetUserPermissions).toHaveBeenCalledWith(getUser, getToken);
      expect(mockedInitVisibility).toHaveBeenCalledTimes(1);

      const args = mockedInitVisibility.mock.calls[0][0];
      expect(args.getUser).toBe(getUser);
      expect(args.isPreview).toBe(false);
      expect(typeof args.getUserPermissions).toBe('function');
      // The live token getter is forwarded to the visibility functions unchanged.
      expect(args.getToken).toBe(getToken);
      await expect(args.getToken()).resolves.toBe('test-token');
    });

    it('forwards a live token getter so a renewed token is reflected (no frozen snapshot)', async () => {
      let token = 'old-token';
      const getToken = jest.fn(() => Promise.resolve(token));
      initVisibilityFunctions({ getUser, getToken });

      const args = mockedInitVisibility.mock.calls[0][0];
      await expect(args.getToken()).resolves.toBe('old-token');

      // Simulate a silent renew updating the current token.
      token = 'new-token';
      await expect(args.getToken()).resolves.toBe('new-token');
    });
  });
});

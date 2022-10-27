/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from 'axios';
import { OFFLINE_REDIRECT_STORAGE_KEY } from '../utils/consts';

jest.mock('axios', () => {
  return {
    post: jest.fn(() => Promise.resolve()),
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })),
  };
});

jest.mock('./offline', () => {
  const actual = jest.requireActual('./offline');
  return {
    __esModule: true,
    ...actual,
    default: {
      ...actual,
    },
  };
});

import * as offline from './offline';

const defaults: Record<string, Record<string, string>> = {
  location: {
    hash: '#foo=bar',
    search: '?noauth=2402500adeacc30eb5c5a8a5e2e0ec1f',
    href: 'https://test.com/some/path?noauth=2402500adeacc30eb5c5a8a5e2e0ec1f#foo=bar',
    origin: 'https://test.com',
    host: 'https://test.com',
    pathname: '/some/path',
  },
};

function getMockWindow(location = defaults.location) {
  const loc = location;
  return {
    location: loc,
    history: {
      pushState: (_one: unknown, _two: unknown, url: string) => {
        loc.__foo__ = url;
      },
    },
  };
}

describe('Offline', () => {
  test('window works', () => {
    // this is really just to reach 100% for this module
    // getWindow was just introduced to allow for code to work
    // and test code too
    expect(offline.getWindow()).toBe(window);
  });
  describe('getOfflineToken', () => {
    beforeEach(() => {
      global.window = Object.create(window);
      Object.defineProperty(window, 'location', {
        value: getMockWindow().location,
        writable: true,
      });
      Object.defineProperty(window, 'history', {
        value: getMockWindow().history,
        writable: true,
      });
      localStorage.setItem(OFFLINE_REDIRECT_STORAGE_KEY, getMockWindow().location.href);
    });
    test('fails when there is no offline postbackUrl', async () => {
      try {
        await offline.getOfflineToken('foo', 'bar');
      } catch (e) {
        expect(e).toBe('not available');
      }
    });

    test('POSTs to /token with the right parameters when input is good', async () => {
      window.location.hash = '#test=bar&code=test123';
      offline.wipePostbackParamsThatAreNotForUs();
      await offline.getOfflineToken('', 'test321');
      expect(axios.post).toHaveBeenCalledWith(
        'https://sso.qa.redhat.com/auth/realms//protocol/openid-connect/token',
        'code=test123&grant_type=authorization_code&client_id=test321&redirect_uri=https%3A%2F%2Ftest.com%2Fsome%2Fpath%3Fnoauth%3D2402500adeacc30eb5c5a8a5e2e0ec1f',
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
    });
  });

  describe('wipePostbackParamsThatAreNotForUs', () => {
    describe('when no auth param is present', () => {
      const getPostbackUrl = offline.getPostbackUrl;
      beforeEach(() => {
        global.window = Object.create(window);
        Object.defineProperty(window, 'location', {
          value: getMockWindow().location,
          writable: true,
        });
        Object.defineProperty(window, 'history', {
          value: getMockWindow().history,
          writable: true,
        });
        localStorage.setItem(OFFLINE_REDIRECT_STORAGE_KEY, getMockWindow().location.href);
        offline.wipePostbackParamsThatAreNotForUs();
      });

      test('strips hash', () => {
        expect(window.location.hash).toBe('');
      });

      test('sets postbackUrl', () => {
        expect(getPostbackUrl()).toBe('https://test.com/some/path?noauth=2402500adeacc30eb5c5a8a5e2e0ec1f');
      });

      test('removes noauth query param', () => {
        // @ts-ignore
        expect(window.location.__foo__).not.toMatch('noauth=2402500adeacc30eb5c5a8a5e2e0ec1');
      });

      test('removes noauth query param with others', () => {
        window.location.href = 'https://example.com?noauth=2402500adeacc30eb5c5a8a5e2e0ec1f&test=bar&bar=baz';
        offline.wipePostbackParamsThatAreNotForUs();
        // @ts-ignore
        expect(window.location.__foo__).toMatch('https://example.com/?test=bar&bar=baz');
      });
    });
  });

  describe('parseHashString', () => {
    const parseHashString = offline.parseHashString;
    test('can parse KC form data in hash', () => {
      const url = 'https://cloud.redhat.com/?foo=bar#bar=baz&foo=bar';
      expect(parseHashString(url)).toMatchObject({
        bar: 'baz',
        foo: 'bar',
      });
    });
  });

  describe('getPostDataObject', () => {
    const getPostDataObject = offline.getPostDataObject;
    test('returns valid parameters', () => {
      const o = getPostDataObject('https://example.com', 'cloud-services', 'deadbeef');
      expect(o).toHaveProperty('code', 'deadbeef');
      expect(o).toHaveProperty('grant_type', 'authorization_code');
      expect(o).toHaveProperty('redirect_uri', 'https%3A%2F%2Fexample.com');
      expect(o).toHaveProperty('client_id', 'cloud-services');
    });
  });

  describe('getPostbackUrl', () => {
    const getPostbackUrl = offline.getPostbackUrl;
    test('can get the URL once', () => {
      offline.wipePostbackParamsThatAreNotForUs();
      expect(getPostbackUrl()).toEqual(expect.any(String));
    });
    test('cannot get URL twice', () => {
      offline.wipePostbackParamsThatAreNotForUs();
      expect(getPostbackUrl()).toEqual(expect.any(String));
      expect(getPostbackUrl()).toBe(undefined);
    });
  });
});

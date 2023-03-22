/* eslint-disable @typescript-eslint/ban-ts-comment */
import cookie from 'js-cookie';

import { data as encodedToken } from '../../testdata/encodedToken.json';
import decodedToken from '../../testdata/decodedToken.json';

import * as jwt from './jwt';
import * as user from './user';

jest.mock('keycloak-js');
jest.mock('urijs');

function mockLocation(path: string) {
  global.window = Object.create(window);
  Object.defineProperty(window, 'location', {
    value: {
      pathname: path,
    },
    writable: true,
  });
}

const blankOptions = {
  cookieName: '',
  clientId: '',
  realm: '',
};

describe('JWT', () => {
  beforeAll(() => {
    // Initialize mock keycloak in JWT
    jwt.init(blankOptions);
  });

  beforeEach(() => {
    window.document.cookie = '';
  });

  describe('getCookieExpires', () => {
    test('should expire at epoch if 0 is given', () => {
      expect(jwt.getCookieExpires(0)).toBe('Thu, 01 Jan 1970 00:00:00 GMT');
    });

    test('should expire at now if now is given', () => {
      const now = new Date();
      const nowString = now.toUTCString();
      const nowUnix = Math.floor(now.getTime() / 1000);
      expect(jwt.getCookieExpires(nowUnix)).toBe(nowString);
    });
  });

  describe('setCookie', () => {
    test('sets a cookie that expires on the same second the JWT expires', () => {
      jwt.setCookie(encodedToken);
      expect(window.document.cookie).toEqual(
        `cs_jwt=${encodedToken};` + `path=/api/edge/v1;` + `secure=true;` + `expires=Wed, 24 Apr 2019 17:13:47 GMT`
      );
    });
  });

  describe('decodeToken', () => {
    test('decodes a valid token', () => {
      expect(jwt.decodeToken(encodedToken)).toMatchObject(decodedToken);
    });

    test('throws an error for an invalid token', () => {
      expect(() => jwt.decodeToken(encodedToken.replace('.', '.abc'))).toThrow('Invalid token');
    });
  });

  describe('isExistingValid', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    test('missing token', () => {
      expect(jwt.isExistingValid()).toBeFalsy();
    });

    test('missing exp field', () => {
      const missingExp = decodedToken;
      // @ts-ignore
      delete missingExp.exp;

      const decodeTokenSpy = jest.spyOn(jwt, 'decodeToken').mockReturnValueOnce(missingExp);

      expect(jwt.isExistingValid(encodedToken)).toBeFalsy();
      decodeTokenSpy.mockRestore();
    });

    test('expired token', () => {
      expect(jwt.isExistingValid(encodedToken)).toBeFalsy();
    });

    test('valid token', () => {
      // mock Date.now function to always be in the past.
      const nowMock = jest.spyOn(global.Date, 'now').mockReturnValueOnce(1);

      expect(jwt.isExistingValid(encodedToken)).toBeTruthy();
      nowMock.mockRestore();
    });
  });

  describe('init', () => {
    test('no token', () => {
      expect(jwt.init(blankOptions)).toBeTruthy();
    });

    test('invalid token', () => {
      // @ts-ignore
      blankOptions.token = encodedToken;

      const isExistingValidSpy = jest.spyOn(jwt, 'isExistingValid').mockReturnValueOnce(false);
      expect(jwt.init(blankOptions)).toBeTruthy();
      expect(jwt.isAuthenticated()).toBeFalsy();
      isExistingValidSpy.mockRestore();
    });

    test('valid token', async () => {
      // @ts-ignore
      blankOptions.token = encodedToken;
      // mock Date.now function to always be in the past.
      const nowMock = jest.spyOn(global.Date, 'now').mockReturnValueOnce(1);

      const isExistingValidSpy = jest.spyOn(jwt, 'isExistingValid').mockReturnValueOnce(true);

      await jwt.init(blankOptions);
      expect(jwt.isAuthenticated()).toBeTruthy();
      isExistingValidSpy.mockRestore();
      nowMock.mockRestore();
    });
  });

  // TODO: Test doOffline more thoroughly.
  // At the moment, it isn't clear how to verify its results.
  describe('doOffline', () => {
    test('doOffline works', () => {
      expect(jwt.doOffline('foo', 'bar')).not.toBeDefined();
    });
  });

  describe('auth channel', () => {
    test('logoutAllTabs', () => {
      const logoutSpy = jest.spyOn(jwt, 'logout').mockImplementationOnce(() => {
        cookie.remove('cs_jwt');
      });

      cookie.set('cs_jwt', 'token1');
      jwt.logoutAllTabs();
      expect(cookie.get('cs_jwt')).not.toBeDefined();

      logoutSpy.mockRestore();
    });

    // test('loginAllTabs', () => {
    //     cookie.remove('cs_jwt');
    //     const loginAllTabs = jwt.__get__('loginAllTabs');
    //     JWTRewireAPI.__Rewire__('login', () => {
    //         cookie.set('cs_jwt', 'token1');
    //     });
    //     loginAllTabs();
    //     expect(cookie.get('cs_jwt')).toBeDefined();
    // });

    // test('refreshTokens', () => {
    //     const refreshTokens = jwt.__get__('refreshTokens');
    //     JWTRewireAPI.__Rewire__('updateToken', () => {
    //         cookie.remove('cs_jwt');
    //         cookie.set('cs_jwt', 'updatedToken');
    //     });

    //     // Log in and verify that the token is correct
    //     jwt.login();
    //     expect(cookie.get('cs_jwt')).toBe('token1');

    //     // Refresh token and make sure it changed
    //     refreshTokens();
    //     expect(cookie.get('cs_jwt')).toBe('updatedToken');

    // });
  });

  describe('init and auth functions', () => {
    describe('initSuccess()', () => {
      beforeEach(() => {
        window.document.cookie = '';
      });

      test('should set a cookie', () => {
        jwt.initSuccess();
        expect(window.document.cookie.includes(encodedToken)).toEqual(true);
      });
    });

    test('initError', () => {
      const logoutSpy = jest.spyOn(jwt, 'logout').mockImplementationOnce(() => {
        cookie.remove('cs_jwt');
      });

      cookie.set('cs_jwt', 'true');
      jwt.initError();
      expect(cookie.get('cs_jwt')).not.toBeDefined();

      logoutSpy.mockRestore();
    });

    test('login', () => {
      cookie.remove('cs_jwt');
      jwt.login();
      expect(cookie.get('cs_jwt')).toBeDefined();
    });

    describe('logout', () => {
      test('should destroy the cookie', () => {
        cookie.set('cs_jwt', 'testvalue');
        jwt.logout();
        expect(cookie.get('cs_jwt')).not.toBeDefined();
      });
    });

    test('expiredToken', () => {
      cookie.set('cs_jwt', 'testvalue');
      jwt.expiredToken();
      expect(cookie.get('cs_jwt')).not.toBeDefined();
    });

    test('updateToken', () => {
      cookie.set('cs_jwt', 'token1');
      jwt.updateToken();
      expect(cookie.get('cs_jwt')).toBe('updatedToken');
    });
  });

  describe('helper functions', () => {
    describe('getUserInfo', () => {
      const updateTokenMockSpy = jest.spyOn(jwt, 'updateToken');
      const isExistingValidSpy = jest.spyOn(jwt, 'isExistingValid');

      beforeEach(() => {
        updateTokenMockSpy.mockReset();
        isExistingValidSpy.mockReset();
        cookie.set('cs_jwt', 'deadbeef');
      });

      test('return right away if the cookie and token are good', async () => {
        const mockUser = { name: 'John Guy' };
        // @ts-ignore
        jest.spyOn(user, 'default').mockImplementation((data: unknown) => (data ? mockUser : null));
        // make token not expired
        const nowMock = jest.spyOn(global.Date, 'now').mockReturnValue(1);
        cookie.set('cs_jwt', encodedToken);

        const data = await jwt.getUserInfo();
        expect(data).toEqual(mockUser);
        nowMock.mockRestore();
      });

      describe('token update fails', () => {
        const loginSpy = jest.spyOn(jwt, 'login');
        async function doTest(url: string, expectedToWork: boolean) {
          isExistingValidSpy.mockReturnValueOnce(false);
          mockLocation(url);
          updateTokenMockSpy.mockImplementation(() => Promise.resolve());

          return jwt.getUserInfo().then(() => {
            if (expectedToWork) {
              expect(loginSpy).toBeCalled();
            } else {
              expect(loginSpy).not.toBeCalled();
            }

            loginSpy.mockReset();
          });
        }

        test('should call login on an authenticated page', () => {
          return doTest('/insights/foobar', true);
        });
      });

      describe('token update passes', () => {
        const loginSpy = jest.spyOn(jwt, 'login');
        test('should *not* call login', () => {
          cookie.remove('cs_jwt');
          mockLocation('/insights/foobar');
          updateTokenMockSpy.mockReturnValue(
            new Promise((res) => {
              res();
            })
          );

          return jwt.getUserInfo().then(() => {
            expect(loginSpy).not.toBeCalled();
          });
        });
      });

      test('should give you a valid user object', async () => {
        const mockUser = { name: 'John Guy' };
        const options = blankOptions;

        jest.spyOn(jwt, 'isExistingValid').mockImplementation((data) => !!data);
        // @ts-ignore
        jest.spyOn(user, 'default').mockImplementation((data: unknown) => (data ? mockUser : null));
        // @ts-ignore
        options.token = encodedToken;
        // @ts-ignore
        options.tokenParsed = decodedToken;
        await jwt.init(options);
        const userResult = await jwt.getUserInfo();
        expect(userResult).toBe(mockUser);
      });
    });

    test('getEncodedToken', () => {
      expect(jwt.getEncodedToken()).toBe(encodedToken);
    });

    test('getUrl', async () => {
      const url = await jwt.getUrl();
      expect(url).toBe('https://sso.qa.redhat.com/auth');
    });

    test('getUrl with custom URL', async () => {
      const url = await jwt.getUrl('https://custom-url.com/auth');
      expect(url).toBe('https://custom-url.com/auth');
    });
  });
});

import cookie from 'js-cookie';

const encodedToken = require('../../../testdata/encodedToken.json').data;
const decodedToken = require('../../../testdata/decodedToken.json');
const jwt = require('./jwt');
import * as insightsUser from './insights/user';
import * as insightsUrl from './insights/url';

jest.mock('@redhat-cloud-services/keycloak-js');
jest.mock('urijs');

jest.mock('./jwt', () => {
  const actual = jest.requireActual('./jwt');
  return {
    __esModule: true,
    ...Object.entries(actual).reduce(
      (acc, [key, imp]) => ({
        ...acc,
        [key]: jest.fn(imp),
      }),
      {}
    ),
  };
});

function mockLocation(path) {
  global.window = Object.create(window);
  Object.defineProperty(window, 'location', {
    value: {
      pathname: path,
    },
    writable: true,
  });
}

describe('JWT', () => {
  beforeAll(() => {
    // Initialize mock keycloak in JWT
    jwt.init({});
  });

  afterEach(() => {
    // eslint-disable-next-line
        __rewire_reset_all__();
  });

  describe('getCookieExpires', () => {
    test('should expire at epoch if 0 is given', () => {
      expect(jwt.getCookieExpires(0)).toBe('Thu, 01 Jan 1970 00:00:00 GMT');
    });

    test('should expire at now if now is given', () => {
      const now = new Date();
      const nowString = now.toGMTString();
      const nowUnix = Math.floor(now.getTime() / 1000);
      expect(jwt.getCookieExpires(nowUnix)).toBe(nowString);
    });
  });

  describe('setCookie', () => {
    test('sets a cookie that expires on the same second the JWT expires', () => {
      const setCookieWrapper = jest.spyOn(jwt, 'setCookieWrapper');
      jwt.setCookie(encodedToken);
      expect(setCookieWrapper).toBeCalledWith(`cs_jwt=${encodedToken};` + `path=/;` + `secure=true;` + `expires=Wed, 24 Apr 2019 17:13:47 GMT`);
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
    test('missing token', () => {
      expect(jwt.isExistingValid()).toBeFalsy();
    });

    test('missing exp field', () => {
      let missingExp = decodedToken;
      delete missingExp.exp;

      const decodeTokenSpy = jest.spyOn(jwt, 'decodeToken').mockReturnValueOnce(missingExp);

      expect(jwt.isExistingValid(encodedToken)).toBeFalsy();
      decodeTokenSpy.mockRestore();
    });

    test('expired token', () => {
      expect(jwt.isExistingValid(encodedToken)).toBeFalsy();
    });

    test('valid token', () => {
      let notExpiring = decodedToken;
      notExpiring.exp = Date.now() + 100000;

      const decodeTokenSpy = jest.spyOn(jwt, 'decodeToken').mockReturnValueOnce(notExpiring);

      expect(jwt.isExistingValid(encodedToken)).toBeTruthy();
      decodeTokenSpy.mockRestore();
    });
  });

  describe('init', () => {
    let options = {};

    test('no token', () => {
      expect(jwt.init(options)).toBeTruthy();
    });

    test('invalid token', () => {
      options.token = encodedToken;

      const isExistingValidSpy = jest.spyOn(jwt, 'isExistingValid').mockReturnValueOnce(false);
      expect(jwt.init(options)).toBeTruthy();
      expect(jwt.isAuthenticated()).toBeFalsy();
      isExistingValidSpy.mockRestore();
    });

    test('valid token', async () => {
      options.token = encodedToken;

      const isExistingValidSpy = jest.spyOn(jwt, 'isExistingValid').mockReturnValueOnce(true);

      await jwt.init(options);
      expect(jwt.isAuthenticated()).toBeTruthy();
      isExistingValidSpy.mockRestore();
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
      test.only('should set a cookie', () => {
        const mockSetCookie = jest.spyOn(jwt, 'setCookie');
        // jwt.setCookie = jest.fn(jwt.setCookie);

        console.warn(jwt.setCookie);
        jwt.initSuccess();
        expect(mockSetCookie).toBeCalledWith(encodedToken);
      });
    });

    test('initError', () => {
      const logoutSpy = jest.spyOn(jwt, 'logout').mockImplementationOnce(() => {
        cookie.remove('cs_jwt');
      });

      cookie.set('cs_jwt', true);
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

      test('return right away if the cookie and token are good', () => {
        cookie.set('cs_jwt', encodedToken);
        isExistingValidSpy.mockReturnValueOnce(true);
        isExistingValidSpy.mockReturnValueOnce(true);
        updateTokenMockSpy.mockReturnValue(
          new Promise((res) => {
            res();
          })
        );

        return jwt.getUserInfo().then(() => {
          expect(isExistingValidSpy).toHaveBeenCalledTimes(2);
          expect(updateTokenMockSpy).not.toHaveBeenCalled();
        });
      });

      describe('token update fails', () => {
        const loginSpy = jest.spyOn(jwt, 'login');
        function doTest(url, expectedToWork) {
          isExistingValidSpy.mockReturnValueOnce(false);
          mockLocation(url);
          updateTokenMockSpy.mockReturnValue(
            new Promise((res, rej) => {
              rej();
            })
          );

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

        test('should *not* call login on an unauthenticated page', () => {
          return doTest('/', false);
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
        let mockUser = { name: 'John Guy' };
        let options = {};
        jest.spyOn(jwt, 'isExistingValid').mockImplementation((data) => !!data);
        jest.spyOn(insightsUser, 'default').mockImplementation((data) => (data ? mockUser : null));
        options.token = encodedToken;
        options.tokenParsed = decodedToken;
        await jwt.init(options);
        expect(jwt.getUserInfo()).toBe(mockUser);
      });
    });

    test('getEncodedToken', () => {
      expect(jwt.getEncodedToken()).toBe(encodedToken);
    });

    test('getUrl', () => {
      let mockUrl = 'www.redhat.com/test-zone';
      jest.spyOn(insightsUrl, 'default').mockImplementation((data) => (data ? mockUrl : null));
      expect(jwt.getUrl()).toBe(mockUrl);
    });
  });
});

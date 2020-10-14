import { __RewireAPI__ as JWTRewireAPI } from './jwt.js';
import cookie from 'js-cookie';

const encodedToken = require('../../../testdata/encodedToken.json').data;
const decodedToken = require('../../../testdata/decodedToken.json');
const jwt = require('./jwt');

jest.mock('@redhat-cloud-services/keycloak-js');
// jest.mock('@redhat-cloud-services/keycloak-js', () => jest.fn().mockImplementation((options) => {
//     const token = require('../../../testdata/encodedToken.json').data;
//     return {
//         ...options,
//         token,
//         refreshToken: token,
//         init: () => new Promise(res => res()),
//         login: () => {
//             // document.cookie = `cs_jwt=${token};`;
//             return new Promise(res => res());
//         },
//         clearToken: () => new Promise(res => res()),
//         updateToken: () => new Promise(res => res())
//     };
// }));
jest.mock('urijs');

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
    const getCookieExpires = jwt.__get__('getCookieExpires');
    test('should expire at epoch if 0 is given', () => {
      expect(getCookieExpires(0)).toBe('Thu, 01 Jan 1970 00:00:00 GMT');
    });

    test('should expire at now if now is given', () => {
      const now = new Date();
      const nowString = now.toGMTString();
      const nowUnix = Math.floor(now.getTime() / 1000);
      expect(getCookieExpires(nowUnix)).toBe(nowString);
    });
  });

  describe('setCookie', () => {
    test('sets a cookie that expires on the same second the JWT expires', () => {
      const setCookie = jwt.__get__('setCookie');
      const setCookieWrapper = jest.fn();
      jwt.__set__('setCookieWrapper', setCookieWrapper);
      setCookie(encodedToken);
      expect(setCookieWrapper).toBeCalledWith(`cs_jwt=${encodedToken};` + `path=/;` + `secure=true;` + `expires=Wed, 24 Apr 2019 17:13:47 GMT`);
    });
  });

  describe('decodeToken', () => {
    const decodeToken = jwt.__get__('decodeToken');

    test('decodes a valid token', () => {
      expect(decodeToken(encodedToken)).toMatchObject(decodedToken);
    });

    test('throws an error for an invalid token', () => {
      expect(() => decodeToken(encodedToken.replace('.', '.abc'))).toThrow('Invalid token');
    });
  });

  describe('isExistingValid', () => {
    const isExistingValid = jwt.__get__('isExistingValid');

    test('missing token', () => {
      expect(isExistingValid()).toBeFalsy();
    });

    test('missing exp field', () => {
      let missingExp = decodedToken;
      delete missingExp.exp;

      JWTRewireAPI.__Rewire__('decodeToken', () => {
        return missingExp;
      });
      expect(isExistingValid(encodedToken)).toBeFalsy();
    });

    test('expired token', () => {
      expect(isExistingValid(encodedToken)).toBeFalsy();
    });

    test('valid token', () => {
      let notExpiring = decodedToken;
      notExpiring.exp = Date.now() + 100000;

      JWTRewireAPI.__Rewire__('decodeToken', () => {
        return notExpiring;
      });

      expect(isExistingValid(encodedToken)).toBeTruthy();
    });
  });

  describe('init', () => {
    let options = {};

    test('no token', () => {
      expect(jwt.init(options)).toBeTruthy();
    });

    test('invalid token', () => {
      options.token = encodedToken;
      JWTRewireAPI.__Rewire__('isExistingValid', () => {
        return false;
      });
      expect(jwt.init(options)).toBeTruthy();
      expect(jwt.isAuthenticated()).toBeFalsy();
    });

    test('valid token', () => {
      options.token = encodedToken;
      JWTRewireAPI.__Rewire__('isExistingValid', () => {
        return true;
      });
      expect(jwt.init(options)).toBeTruthy();
      expect(jwt.isAuthenticated()).toBeTruthy();
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
      JWTRewireAPI.__Rewire__('logout', () => {
        cookie.remove('cs_jwt');
      });
      cookie.set('cs_jwt', 'token1');
      jwt.logoutAllTabs();
      expect(cookie.get('cs_jwt')).not.toBeDefined();
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
      const initSuccess = jwt.__get__('initSuccess');
      test('should set a cookie', () => {
        const mockSetCookie = jest.fn();
        jwt.__set__('setCookie', mockSetCookie);
        initSuccess();
        expect(mockSetCookie).toBeCalledWith(encodedToken);
      });
    });

    test('initError', () => {
      const initError = jwt.__get__('initError');
      JWTRewireAPI.__Rewire__('logout', () => {
        cookie.remove('cs_jwt');
      });
      cookie.set('cs_jwt', true);
      initError();
      expect(cookie.get('cs_jwt')).not.toBeDefined();
    });

    test('login', () => {
      cookie.remove('cs_jwt');
      jwt.login();
      expect(cookie.get('cs_jwt')).toBeDefined();
    });

    describe('logout', () => {
      test('should destroy the cookie', () => {
        const logout = jwt.__get__('logout');
        cookie.set('cs_jwt', 'testvalue');
        logout();
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
      const updateToken = jwt.__get__('updateToken');
      updateToken();
      expect(cookie.get('cs_jwt')).toBe('updatedToken');
    });
  });

  describe('helper functions', () => {
    describe('getUserInfo', () => {
      function doMockWindow(path) {
        require('../utils').__set__('getWindow', () => {
          return {
            location: {
              pathname: path,
            },
          };
        });
      }

      const updateTokenMock = jest.fn();
      const isExistingValidMock = jest.fn();

      beforeEach(() => {
        isExistingValidMock.mockReset();
        updateTokenMock.mockReset();
        cookie.set('cs_jwt', 'deadbeef');
        jwt.__set__('updateToken', updateTokenMock);
        jwt.__set__('isExistingValid', isExistingValidMock);
      });

      test('return right away if the cookie and token are good', () => {
        cookie.set('cs_jwt', encodedToken);
        isExistingValidMock.mockReturnValueOnce(true);
        isExistingValidMock.mockReturnValueOnce(true);
        updateTokenMock.mockReturnValue(
          new Promise((res) => {
            res();
          })
        );

        return jwt.getUserInfo().then(() => {
          expect(isExistingValidMock).toHaveBeenCalledTimes(2);
          expect(updateTokenMock).not.toHaveBeenCalled();
        });
      });

      describe('token update fails', () => {
        const loginSpy = jest.spyOn(jwt, 'login');
        function doTest(url, expectedToWork) {
          isExistingValidMock.mockReturnValueOnce(false);
          doMockWindow(url);
          jwt.login = jest.fn();
          updateTokenMock.mockReturnValue(
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
          doMockWindow('/insights/foobar');
          updateTokenMock.mockReturnValue(
            new Promise((res) => {
              res();
            })
          );

          return jwt.getUserInfo().then(() => {
            expect(loginSpy).not.toBeCalled();
          });
        });
      });

      test('should give you a valid user object', () => {
        let mockUser = { name: 'John Guy' };
        let options = {};
        options.tokenParsed = decodedToken;
        jwt.init(options);
        JWTRewireAPI.__Rewire__('isExistingValid', (data) => (data ? true : false));
        JWTRewireAPI.__Rewire__('insightsUser', (data) => (data ? mockUser : null));
        expect(jwt.getUserInfo()).toBe(mockUser);
      });
    });

    test('getEncodedToken', () => {
      expect(jwt.getEncodedToken()).toBe(encodedToken);
    });

    test('getUrl', () => {
      let mockUrl = 'www.redhat.com/test-zone';
      JWTRewireAPI.__Rewire__('insightsUrl', (data) => (data ? mockUrl : null));
      expect(jwt.getUrl()).toBe(mockUrl);
    });
  });
});

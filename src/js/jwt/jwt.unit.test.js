/*global expect, require, test, describe, jest*/
import { __RewireAPI__ as JWTRewireAPI } from './jwt.js';
import cookie from 'js-cookie';

const encodedToken      = require('../../../testdata/encodedToken.json').data;
const decodedToken      = require('../../../testdata/decodedToken.json');
const jwt               = require('./jwt');

jest.mock('keycloak-js');
jest.mock('urijs');

describe('JWT', () => {

    beforeAll(() => {
        // Initialize mock keycloak in JWT
        jwt.init({});
    });

    beforeEach(() => {
        // eslint-disable-next-line
        __rewire_reset_all__();
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

    describe('doOffline', () => {
        // TODO: How do we test this more thoroughly?
        // doOffline doesn't return anything, nor does it directly
        // affect the internal state of the jwt object.
        test('doOffline works', () => {
            // Function returns nothing, and that's what we should expect.
            expect(jwt.doOffline('foo', 'bar')).not.toBeDefined();
        });
    });

    describe('auth channel', () => {
        test('logoutAllTabs', () => {
            JWTRewireAPI.__Rewire__('logout', () => {
                cookie.remove('login');
            });
            cookie.set('login', true);
            jwt.logoutAllTabs();
            expect(cookie.get('login')).not.toBeDefined();
        });

        test('loginAllTabs', () => {
            JWTRewireAPI.__Rewire__('logout', () => {
                cookie.set('login', true);
            });
            cookie.remove('login');
            jwt.logoutAllTabs();
            expect(cookie.get('login')).toBeTruthy();
        });

        test('refreshTokens', () => {
            const refreshTokens = jwt.__get__('refreshTokens');
            expect(refreshTokens()).not.toBeDefined();
            // TODO: Can we check anything else for this function?
            // All it does is log.
        });
    });

    describe('init and auth functions', () => {
        test('initSuccess()', () => {
            const initSuccess = jwt.__get__('initSuccess');
            initSuccess();
            expect(window.localStorage.getItem('cs_jwt')).toContain(encodedToken);
        });

        test('initError', () => {
            const initError = jwt.__get__('initError');
            JWTRewireAPI.__Rewire__('logout', () => {
                cookie.remove('login');
            });
            cookie.set('login', true);
            initError();
            expect(cookie.get('login')).not.toBeDefined();
        });

        test('login', () => {
            const login = jwt.__get__('login');
            login();
            // TODO: What can we even test here?
        });

        test('logout', () => {
            const logout = jwt.__get__('logout');
            cookie.set('cs_jwt', 'testvalue', { domain: '.redhat.com' });
            logout();
            expect(cookie.get('cs_jwt')).not.toBeDefined();
        });

        test('expiredToken', () => {
            cookie.set('cs_jwt', 'testvalue', { domain: '.redhat.com' });
            jwt.expiredToken();
            expect(cookie.get('cs_jwt')).not.toBeDefined();
        });
    });

    describe('helper functions', () => {

        test('getUserInfo', () => {
            let mockUser = { name: 'John Guy' };
            let options = {};
            options.tokenParsed = decodedToken;
            jwt.init(options);
            JWTRewireAPI.__Rewire__('isExistingValid', (data) => data ? true : false);
            JWTRewireAPI.__Rewire__('insightsUser', (data) => data ? mockUser : null);
            expect(jwt.getUserInfo()).toBe(mockUser);
        });

        test('getEncodedToken', () => {
            expect(jwt.getEncodedToken()).toBe(encodedToken);
        });

        test('getUrl', () => {
            let mockUrl = 'www.redhat.com/test-zone';
            JWTRewireAPI.__Rewire__('insightsUrl', (data) => data ? mockUrl : null);
            expect(jwt.getUrl()).toBe(mockUrl);
        });
    });
});

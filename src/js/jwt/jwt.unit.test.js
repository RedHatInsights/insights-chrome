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

    afterEach(() => {
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

        test('loginAllTabs', () => {
            cookie.remove('cs_jwt');
            const loginAllTabs = jwt.__get__('loginAllTabs');
            JWTRewireAPI.__Rewire__('login', () => {
                cookie.set('cs_jwt', 'token1');
            });
            loginAllTabs();
            expect(cookie.get('cs_jwt')).toBeDefined();
        });

        test('refreshTokens', () => {
            const refreshTokens = jwt.__get__('refreshTokens');
            JWTRewireAPI.__Rewire__('updateToken', () => {
                cookie.remove('cs_jwt');
                cookie.set('cs_jwt', 'updatedToken');
            });

            // Log in and verify that the token is correct
            jwt.login();
            expect(cookie.get('cs_jwt')).toBe('token1');

            // Refresh token and make sure it changed
            refreshTokens();
            expect(cookie.get('cs_jwt')).toBe('updatedToken');

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

        test('logout', () => {
            const logout = jwt.__get__('logout');
            cookie.set('cs_jwt', 'testvalue');
            logout();
            expect(cookie.get('cs_jwt')).not.toBeDefined();
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

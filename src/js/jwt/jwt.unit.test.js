/*global expect, require, test, describe, jest*/
import { __RewireAPI__ as JWTRewireAPI } from './jwt.js';
import cookie from 'js-cookie';

const encodedTokenFile  = require('../../../testdata/encodedToken.json');
const decodedToken      = require('../../../testdata/decodedToken.json');
const jwt               = require('./jwt');

jest.mock('keycloak-js');
jest.mock('urijs');

describe('JWT', () => {

    const encodedToken = encodedTokenFile.data;

    beforeAll(() => {
        // Initialize mock keycloak in JWT
        jwt.init({});
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
        let options = {};;

        test('no token', () => {
            expect(jwt.init(options)).toBeTruthy();
        });

        test('invalid token', () => {
            options.token = 'invalid_token';
            JWTRewireAPI.__Rewire__('isExistingValid', () => {
                return false;
            });
            expect(jwt.init(options)).toBeTruthy();
            expect(jwt.isAuthenticated()).toBeFalsy();
        });

        test('valid token', () => {
            options.token = 'valid_token';
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

    describe('auth', () => {
        test('logoutAllTabs', () => {
            cookie.set('login', true);
            JWTRewireAPI.__Rewire__('logout', () => {
                cookie.remove('login');
            });
            jwt.logoutAllTabs();
            expect(cookie.get('login')).not.toBeDefined();
        });

        test('loginAllTabs', () => {
            cookie.remove('login');
            JWTRewireAPI.__Rewire__('logout', () => {
                cookie.set('login', true);
            });
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

});

/*global expect, require, test, describe, jest*/
import { __RewireAPI__ as JWTRewireAPI } from './jwt.js';

const encodedTokenFile  = require('../../../testdata/encodedToken.json');
const decodedToken      = require('../../../testdata/decodedToken.json');
const jwt               = require('./jwt');

describe('JWT', () => {

    const encodedToken = encodedTokenFile.data;

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

            JWTRewireAPI.__Rewire__('decodeToken', function() {
                return missingExp;
            });
            expect(isExistingValid(encodedToken)).toBeFalsy();
        });

        test('expired token', () => {
            expect(isExistingValid(encodedToken)).toBeFalsy();
        });

        // TODO: Can't do this until we mock Keycloak
        // test('valid token', () => {
        //     let notExpiring = decodedToken;
        //     notExpiring.exp = Date.now() + 100000;

        //     JWTRewireAPI.__Rewire__('decodeToken', function() {
        //         return notExpiring;
        //     });

        //     expect(isExistingValid(encodedToken)).toBeTruthy();
        // });
    });
});

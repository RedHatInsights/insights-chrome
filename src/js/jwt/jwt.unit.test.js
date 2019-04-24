/*global expect, require, test, describe, jest*/

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

        // TODO: We need to either mock decodeToken() or modify an encoded token for this
        // test('missing exp field', () => {
        //     let missingExp = decodedToken
        //     expect(jwt.isExistingValid(encodedToken)).toBeFalsy();
        // });

        test('expired token', () => {
            expect(isExistingValid(encodedToken)).toBeFalsy();
        });

        // TODO: We need to either mock decodeToken() or modify an encoded token for this
        // test('valid token', () => {
        //     expect(isExistingValid(encodedToken)).toBeTruthy();
        // });
    });
});

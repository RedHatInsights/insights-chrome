/*global expect, require, test, describe, jest*/

const encodedTokenFile  = require('../../../testdata/encodedToken.json');
const decodedToken      = require('../../../testdata/decodedToken.json');
const jwt               = require('./jwt');

describe('JWT', () => {
    describe('decodeToken', () => {

        const encodedToken = encodedTokenFile.data;

        test('decodes a valid token', () => {
            expect(jwt.decodeToken(encodedToken)).toMatchObject(decodedToken);
        });

        test('throws an error for an invalid token', () => {
            expect(() => jwt.decodeToken(encodedToken.replace('.', '.abc'))).toThrow('Invalid token');
        });
    });
});

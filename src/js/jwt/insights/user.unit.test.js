/*global expect, require, test, describe, jest*/
jest.mock('./entitlements');

const mockedEntitlements = require('./entitlements');
const token      = require('../../../../testdata/token.json');
const userOutput = require('../../../../testdata/user.json');
const user       = require('./user');

describe('User', () => {
    const buildUser = user.__get__('buildUser');
    user.__set__('getWindow', () => {
        return {
            location: {
                pathname: '/insights/',
                replace: () => {}
            }
        };
    });

    describe('buildUser', () => {
        test('transforms a token into a User object', () => {
            expect(buildUser(token)).toMatchObject(userOutput);
        });
    });

    describe('default', () => {
        test('appends the entitlements data onto the user object', () => {
            const o = user(token);
            expect(o).toHaveProperty('entitlements', { foo: 'bar' });
            expect(o).toHaveProperty('identity');
        });
        test('uses the token.jti field as a cache key', () => {
            expect(mockedEntitlements).toBeCalledWith(token.jti);
            user(token);
        });
    });
});

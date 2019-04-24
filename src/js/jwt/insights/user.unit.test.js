/*global expect, require, test, describe, jest*/
jest.mock('./entitlements');

const token      = require('../../../../testdata/token.json');
const userOutput = require('../../../../testdata/user.json');
const user       = require('./user');

describe('User', () => {
    const buildUser = user.__get__('buildUser');
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
    });
});

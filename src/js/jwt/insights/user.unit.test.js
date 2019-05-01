/*global expect, require, test, describe, jest, beforeEach*/
jest.mock('./entitlements');

const mockedEntitlements = require('./entitlements');
const token       = require('../../../../testdata/token.json');
const userOutput  = require('../../../../testdata/user.json');
const user        = require('./user');
const replaceMock = jest.fn();

user.__set__('getWindow', () => {
    return {
        location: {
            pathname: '/insights/foo',
            replace: replaceMock
        }
    };
});

describe('User', () => {
    const buildUser = user.__get__('buildUser');

    describe('buildUser', () => {
        test('transforms a token into a User object', () => {
            expect(buildUser(token)).toMatchObject(userOutput);
        });
    });

    /* eslint-disable camelcase */
    describe('tryBounceIfUnentitled', () => {
        const tryBounceIfUnentitled = user.__get__('tryBounceIfUnentitled');
        const ents = {
            insights: {
                is_entitled: false
            }
        };

        beforeEach(() => {
            replaceMock.mockReset();
        });

        test('shouild bounce if unentitled', () => {
            ents.insights.is_entitled = false;
            tryBounceIfUnentitled(ents, 'insights');
            expect(replaceMock).toBeCalledWith('http://localhost/?not_entitled=insights');
        });

        test('should *not* bounce if entitled', () => {
            ents.insights.is_entitled = true;
            tryBounceIfUnentitled(ents, 'insights');
            expect(replaceMock).not.toBeCalled();
        });
    });
    /* eslint-enable camelcase */

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

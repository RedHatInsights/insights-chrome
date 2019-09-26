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
            insights: { is_entitled: false },
            smart_management: { is_entitled: false },
            openshift: { is_entitled: false },
            hybrid: { is_entitled: false }
        };

        beforeEach(() => {
            replaceMock.mockReset();
        });

        test('should *not* bounce if the section is unkown', () => {
            ents.insights.is_entitled = false;
            tryBounceIfUnentitled(ents, 'apps');
            tryBounceIfUnentitled(ents, 'foo');
            tryBounceIfUnentitled(ents, 'test');
            expect(replaceMock).not.toBeCalled();
        });

        test('should bounce if unentitled', () => {
            tryBounceIfUnentitled(ents, 'insights');
            expect(replaceMock).lastCalledWith('http://localhost/?not_entitled=insights');

            tryBounceIfUnentitled(ents, 'hybrid');
            expect(replaceMock).lastCalledWith('http://localhost/?not_entitled=hybrid_cloud');
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
            require('../../utils').__set__('getWindow', () => {
                return {
                    location: {
                        pathname: '/insights/foo'
                    }
                };
            });

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

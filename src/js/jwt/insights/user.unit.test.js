/*global expect, require, test, describe, jest, beforeEach*/
jest.mock('./entitlements');

const mockedEntitlements = require('./entitlements');
const token       = require('../../../../testdata/token.json');
const userOutput  = require('../../../../testdata/user.json');
const user        = require('./user');
const replaceMock = jest.fn();
const evalUrl     = 'https://www.redhat.com/wapps/eval/index.html?evaluation_id=1036';
const mockWindow  = {
    location: {
        pathname: '/insights/foo',
        href: '/insights',
        replace: replaceMock
    }
};

function doMockWindow() {
    user.__set__('getWindow', () => {
        return { ...mockWindow };
    });
}

beforeEach(doMockWindow);

describe('User', () => {
    const buildUser = user.__get__('buildUser');

    describe('buildUser', () => {
        test('transforms a token into a User object', () => {
            expect(buildUser(token)).toMatchObject(userOutput);
        });
    });

    /* eslint-disable camelcase */
    describe('tryBounceIfAccountNumberMissing', () => {
        const tryBounceIfAccountNumberMissing = user.__get__('tryBounceIfAccountNumberMissing');
        describe('When account_number is -1', () => {
            for (const section of ['openshift', '']) {
                test(`should *not* bounce on /${section}`, () => {
                    mockWindow.location.href = `/${section}`;
                    tryBounceIfAccountNumberMissing(-1, section);
                    expect(mockWindow.location.href).toBe(`/${section}`);
                });
            }

            for (const section of ['insights', 'rhel', 'hybrid', 'apps']) {
                test(`should bounce on /${section}`, () => {
                    mockWindow.location.href = `/${section}`;
                    tryBounceIfAccountNumberMissing(-1, section);
                    expect(mockWindow.location.href).toBe(evalUrl);
                });
            }
        });
        describe('When account_number is 540155', () => {
            for (const section of ['openshift', 'insights', 'rhel', 'hybrid', 'apps']) {
                test(`should *not* bounce on /${section}`, () => {
                    mockWindow.location.href = `/${section}`;
                    tryBounceIfAccountNumberMissing(540155, section);
                    expect(mockWindow.location.href).toBe(`/${section}`);
                });
            }
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

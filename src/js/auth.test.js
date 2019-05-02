/*global describe, jest, test, require, expect, beforeEach*/
const auth = require('./auth');

function mockWindow(pathname) {
    const add = jest.fn();
    const w = {
        location: { pathname },
        document: {
            querySelector: jest.fn(() => {
                return { classList: { add } };
            })
        }
    };

    auth.__set__('getWindow', () => { return w; });
    return {
        querySelector: w.document.querySelector,
        add
    };
}

describe('Auth', () => {
    describe('allowUnauthed', () => {
        for (const t of ['/insights', '/insights/foo', '/rhel/dashboard',
            '/hybrid', '/openshift/clusters', '/openshift']) {
            test(`should not allow ${t}`, () => {
                const mocks = mockWindow(t);
                expect(auth.allowUnauthed()).toBe(false);
                expect(mocks.querySelector).not.toBeCalled();
                expect(mocks.add).not.toBeCalled();
            });
        }

        for (const t of ['/', '/logout', '/beta', '/beta/']) {
            test(`should allow ${t}`, () => {
                const mocks = mockWindow(t);
                expect(auth.allowUnauthed()).toBe(true);
                expect(mocks.querySelector).toBeCalledWith('body');
                expect(mocks.add).toBeCalledWith('unauthed');
            });
        }
    });

    describe('bouncer', () => {
        const bouncer = auth.__get__('bouncer');
        const jwt = {
            isAuthenticated: jest.fn(),
            login: jest.fn()
        };

        const allowUnauthedMock = jest.fn();
        auth.__set__('allowUnauthed', allowUnauthedMock);

        test('should not bounce when on an unauthed path', () => {
            allowUnauthedMock.mockReturnValueOnce(true);
            bouncer();
            expect(jwt.isAuthenticated).not.toBeCalled();
            expect(jwt.login).not.toBeCalled();
        });
    });
});

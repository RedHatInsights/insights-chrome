/*global describe, jest, test, require, expect, beforeEach*/
const auth = require('./auth');

function mockWindow(pathname) {
    const w = {
        location: { pathname }
    };

    auth.__set__('getWindow', () => { return w; });
}

describe('Auth', () => {
    describe('allowUnauthed', () => {
        for (const t of ['/insights', '/insights/foo', '/rhel/dashboard',
            '/hybrid', '/openshift/clusters', '/openshift']) {
            test(`should not allow ${t}`, () => {
                mockWindow(t);
                expect(auth.allowUnauthed()).toBe(false);
            });
        }

        for (const t of ['/', '/logout', '/beta', '/beta/']) {
            test(`should allow ${t}`, () => {
                mockWindow(t);
                expect(auth.allowUnauthed()).toBe(true);
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

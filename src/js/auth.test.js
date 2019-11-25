const auth = require('./auth');
//const decodedToken = require('../../testdata/')
function mockWindow(pathname) {
    const w = {
        location: { pathname }
    };

    auth.__set__('getWindow', () => { return w; });
}

describe('Auth', () => {
    describe('allowUnauthed', () => {
        ['/insights', '/insights/foo', '/rhel/dashboard',
            '/cost-management', '/openshift/clusters', '/openshift'].map(t => {
            test(`should not allow ${t}`, () => {
                mockWindow(t);
                expect(auth.allowUnauthed()).toBe(false);
            });
        });

        ['/', '/logout', '/beta', '/beta/'].map(t => {
            test(`should allow ${t}`, () => {
                mockWindow(t);
                expect(auth.allowUnauthed()).toBe(true);
            });
        });
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
    it('token works', () => {
        
    });
});

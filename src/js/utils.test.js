const utils = require('./utils');

const testData = [
    { auth: true,  path: '/insights', sec: 'insights' },
    { auth: true,  path: '/insights/', sec: 'insights' },
    { auth: true,  path: '/insights/foo', sec: 'insights' },
    { auth: true,  path: '/insights/beta', sec: 'insights' },
    { auth: true,  path: '/insights/beta/', sec: 'insights' },
    { auth: true,  path: '/insights/beta/foo', sec: 'insights' },
    { auth: true,  path: '/insights/foo/bar/', sec: 'insights' },
    { auth: true,  path: '/cost-management', sec: 'cost-management' },
    { auth: true,  path: '/cost-management/', sec: 'cost-management' },
    { auth: true,  path: '/cost-management/foo', sec: 'cost-management' },
    { auth: true,  path: '/cost-management/foo/bar/', sec: 'cost-management' },
    { auth: true,  path: '/apps/foo/bar/', sec: 'apps' },
    { auth: true,  path: '/apps/insights/bar/', sec: 'apps' },
    { auth: true,  path: '/migrations', sec: 'migrations' },
    { auth: true,  path: '/migrations/foo', sec: 'migrations' },
    { auth: true,  path: '/migrations/foo/bar', sec: 'migrations' },
    { auth: true,  path: '/ansible', sec: 'ansible' },
    { auth: true,  path: '/ansible/foo', sec: 'ansible' },
    { auth: true,  path: '/ansible/foo/bar', sec: 'ansible' },
    { auth: true,  path: '/subscriptions', sec: 'subscriptions' },
    { auth: true,  path: '/subscriptions/foo', sec: 'subscriptions' },
    { auth: true,  path: '/subscriptions/foo/bar', sec: 'subscriptions' },
    { auth: true,  path: '/settings', sec: 'settings' },
    { auth: true,  path: '/settings/foo', sec: 'settings' },
    { auth: true,  path: '/settings/foo/bar', sec: 'settings' },
    { auth: false, path: '/', sec: '' },
    { auth: false, path: '/beta', sec: '' },
    { auth: false, path: '/404', sec: '404' }
];

function doMockWindow(path) {
    utils.__set__('getWindow', () => {
        return { location: { pathname: path } };
    });
}

describe('utils', () => {
    describe('pageRequiresAuthentication', () => {
        testData.map(item => {
            test(`should return ${item.auth} for ${item.path}`, () => {
                doMockWindow(item.path);
                expect(utils.pageRequiresAuthentication()).toBe(item.auth);
            });
        });
    });
    describe('getSections', () => {
        const getSection = utils.__get__('getSection');
        testData.map(item => {
            test(`should extract give you ${item.sec} from ${item.path}`, () => {
                doMockWindow(item.path);
                expect(getSection()).toBe(item.sec);
            });
        });
    });
    describe('isValidAccountNumber', () => {
        test('not a number; should return false', () => {
            expect(utils.isValidAccountNumber(null)).toBe(false);
        });
        test('-1 should return false', () => {
            expect(utils.isValidAccountNumber(-1)).toBe(false);
        });
        test('string -1 should return false', () => {
            expect(utils.isValidAccountNumber('-1')).toBe(false);
        });
    });
});

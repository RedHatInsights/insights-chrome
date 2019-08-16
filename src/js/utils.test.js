/*global describe, test, require, expect*/
const utils = require('./utils');

const testData = [
    { auth: true,  path: '/insights', sec: 'insights' },
    { auth: true,  path: '/insights/', sec: 'insights' },
    { auth: true,  path: '/insights/foo', sec: 'insights' },
    { auth: true,  path: '/insights/beta', sec: 'insights' },
    { auth: true,  path: '/insights/beta/', sec: 'insights' },
    { auth: true,  path: '/insights/beta/foo', sec: 'insights' },
    { auth: true,  path: '/insights/foo/bar/', sec: 'insights' },
    { auth: true,  path: '/hybrid', sec: 'hybrid' },
    { auth: true,  path: '/hybrid/', sec: 'hybrid' },
    { auth: true,  path: '/hybrid/foo', sec: 'hybrid' },
    { auth: true,  path: '/hybrid/foo/bar/', sec: 'hybrid' },
    { auth: true,  path: '/apps/foo/bar/', sec: 'apps' },
    { auth: true,  path: '/apps/insights/bar/', sec: 'apps' },
    { auth: true,  path: '/migration', sec: 'migration' },
    { auth: true,  path: '/migration/foo', sec: 'migration' },
    { auth: true,  path: '/migration/foo/bar', sec: 'migration' },
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
        for (const item of testData) {
            test(`should return ${item.auth} for ${item.path}`, () => {
                doMockWindow(item.path);
                expect(utils.pageRequiresAuthentication()).toBe(item.auth);
            });
        }
    });
    describe('getSections', () => {
        const getSection = utils.__get__('getSection');
        for (const item of testData) {
            test(`should extract give you ${item.sec} from ${item.path}`, () => {
                doMockWindow(item.path);
                expect(getSection()).toBe(item.sec);
            });
        }
    });
});

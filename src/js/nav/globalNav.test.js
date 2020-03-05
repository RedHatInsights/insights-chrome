const masterConfig = require('../../../testdata/masterConfig.json');
const masterConfigPermissions = require('../../../testdata/masterConfigPermissions.json');
const navFunctions = require('./globalNav');
const mock = require('../../__mocks__/rbacApi').mock;
const mockedRbac = require('../../../testdata/rbacAccess.json');

const globalNav = { appA: { title: 'title1', id: 'appA', routes: [{ id: 'subid1', title: 'subtitle1' }] } };

describe('globalNav', () => {
    test('should work as expected', async () => {
        expect((await navFunctions.getNavFromConfig(masterConfig))).toEqual(globalNav);
    });
});

describe('globalNav with permissions', () => {
    let calculatedNav;
    beforeAll(async () => {
        calculatedNav = await navFunctions.getNavFromConfig(masterConfigPermissions);
    });

    test('appA', () => {
        expect(calculatedNav.appA.routes.length).toBe(1);
        expect(calculatedNav.appA.routes[0].id).toBe('subid2');
    });

    test('appB', () => {
        expect(calculatedNav.appB.routes.length).toBe(1);
        expect(calculatedNav.appB.routes[0].id).toBe('subid1');
    });

    test('appC', () => {
        expect(calculatedNav.appC.routes.length).toBe(1);
        expect(calculatedNav.appC.routes[0].id).toBe('subid2');
    });

    test('appD', () => {
        expect(calculatedNav.appD.routes.length).toBe(2);
        expect(calculatedNav.appD.routes[0].id).toBe('subid1');
        expect(calculatedNav.appD.routes[1].id).toBe('insights');
    });

    test('appF', () => {
        expect(calculatedNav.appF).not.toBeDefined();
    });

    test('appG, should have empty navigation', () => {
        mock.onGet('/api/rbac/v1/access/?application=&limit=50').reply(200, mockedRbac);
        expect(calculatedNav.appG).not.toBeDefined();
    });
});

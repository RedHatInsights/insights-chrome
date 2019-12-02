const masterConfig = require('../../../testdata/masterConfig.json');
const navFunctions = require('./globalNav');

const globalNav = { appA: { title: 'title1', id: 'appA', routes: [{ id: 'subid1', title: 'subtitle1' }] } };

describe('globalNav', () => {
    test('should work as expected', () => {
        expect(navFunctions.getNavFromConfig(masterConfig)).toEqual(globalNav);
    });
});


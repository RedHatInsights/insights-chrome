import '../test';
import * as actions from './actions';
import * as reducers from './reducers';
import globalNav from '../nav/globalNav.js';

describe('Reducers', () => {
    describe('Navigation', () => {
        it('activates global navigation element on identifyApp()', () => {
            const state = reducers.globalNavReducer({ globalNav }, actions.identifyApp('inventory', globalNav));
            expect(state.appId).toEqual('inventory');
            const activeItems = state.globalNav.filter(i => i.active);
            expect(activeItems.length).toBe(1);
            expect(activeItems[0].id).toBe('inventory');
        });

        it('throws error on unknown app', () => {
            expect(() => actions.identifyApp('foo', globalNav)).toThrowError('unknown app identifier: foo');
        });

        it('defines app navigation with appNav()', () => {
            const menu = [{
                title: 'Map',
                id: 'map',
                active: false
            }, {
                title: 'Deployments',
                id: 'deployments',
                active: true
            }];
            const state = reducers.appNavReducer({}, actions.appNav(menu));
            expect(state.appNav).toEqual(menu);
        });

        it('throws error on invalid data type', () => {
            expect(() => actions.appNav('foo')).toThrowError('invalid parameter type: string');
        });

        it('throws error on invalid data type', () => {
            expect(() => actions.appNav([{ title: 'Foo' }])).toThrowError('missing id field');
        });
    });
});

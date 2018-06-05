import * as actions from './actions';
import * as reducers from './reducers';

describe('Reducers', () => {
    describe('Navigation', () => {
        it('activates global navigation element on globalNavIdent()', () => {
            const state = reducers.globalNavReducer({}, actions.globalNavIdent('inventory'));
            expect(state.appId).toEqual('inventory');
            const activeItems = state.globalNav.filter(i => i.active);
            expect(activeItems.length).toBe(1);
            expect(activeItems[0].id).toBe('inventory');
        });

        it('throws error on unknown app', () => {
            expect(() => actions.globalNavIdent('foo')).toThrowError('unknown app identifier: foo');
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

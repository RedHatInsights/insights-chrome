import '../test';
import * as actions from './actions';
import * as reducers from './reducers';

const mockNav = [{
    id: 'dashboard',
    title: 'Dashboard'
},
{
    id: 'advisor',
    title: 'Insights',
    subItems: [
        {
            id: 'actions',
            title: 'Actions',
            default: true
        },
        {
            id: 'rules',
            title: 'Rules'
        }
    ]
},
{
    id: 'vulnerability',
    title: 'Vulnerability'
},
{
    id: 'inventory',
    title: 'Inventory'
},
{
    id: 'remediations',
    title: 'Remediations'
}
];

describe('Reducers', () => {
    describe('Navigation', () => {
        it('finds the app using identifyApp()', () => {
            expect(() => actions.identifyApp('inventory', mockNav)).not.toThrowError('unknown app identifier: inventory');
        });

        it('throws error on unknown app', () => {
            expect(() => actions.identifyApp('foo', mockNav)).toThrowError('unknown app identifier: foo');
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

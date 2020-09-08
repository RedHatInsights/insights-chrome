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

    describe('onPageAction', () => {
        it('should add new pageAction', () => {
            const state = reducers.onPageAction({ someState: {} }, actions.appAction('test-action'));
            expect(state).toEqual({
                someState: {},
                pageAction: 'test-action'
            });
        });

        it('should remove pageAction', () => {
            const state = reducers.onPageAction({ someState: {}, pageAction: 'test-action' }, actions.appAction());
            expect(state).toEqual({
                someState: {},
                pageAction: undefined
            });
        });

        it('should replace pageAction', () =>{
            const state = reducers.onPageAction(
                {
                    someState: {},
                    pageAction: 'test-action'
                },
                actions.appAction('different-action')
            );
            expect(state).toEqual({
                someState: {},
                pageAction: 'different-action'
            });
        });
    });

    describe('onPageObjectId', () => {
        it('should add new pageObjectId', () => {
            const state = reducers.onPageObjectId({ someState: {} }, actions.appObjectId('test-object-id'));
            expect(state).toEqual({
                someState: {},
                pageObjectId: 'test-object-id'
            });
        });

        it('should remove pageObjectId', () => {
            const state = reducers.onPageObjectId({ someState: {}, pageObjectId: 'test-object-id' }, actions.appObjectId());
            expect(state).toEqual({
                someState: {},
                pageObjectId: undefined
            });
        });

        it('should replace pageObjectId', () => {
            const state = reducers.onPageObjectId(
                {
                    someState: {},
                    pageObjectId: 'test-object-id'
                },
                actions.appObjectId('different-object-id')
            );
            expect(state).toEqual({
                someState: {},
                pageObjectId: 'different-object-id'
            });
        });
    });
});

describe('onGlobalFilterToggle', () => {
    it('should hide global filter', () => {
        const state = reducers.onGlobalFilterToggle(
            {
                someState: {}
            },
            actions.toggleGlobalFilter()
        );
        expect(state).toEqual({
            someState: {},
            globalFilterHidden: true
        });
    });

    it('should show global filter', () => {
        const state = reducers.onGlobalFilterToggle(
            {
                someState: {}
            },
            actions.toggleGlobalFilter(false)
        );
        expect(state).toEqual({
            someState: {},
            globalFilterHidden: false
        });
    });
});

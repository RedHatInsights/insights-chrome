import '../test';
import * as actions from './actions';
import * as reducers from './reducers';

const mockNav = [
  {
    id: 'dashboard',
    title: 'Dashboard',
  },
  {
    id: 'advisor',
    title: 'Insights',
    subItems: [
      {
        id: 'actions',
        title: 'Actions',
        default: true,
      },
      {
        id: 'rules',
        title: 'Rules',
      },
    ],
  },
  {
    id: 'vulnerability',
    title: 'Vulnerability',
  },
  {
    id: 'inventory',
    title: 'Inventory',
  },
  {
    id: 'remediations',
    title: 'Remediations',
  },
];

describe('Reducers', () => {
  describe('Navigation', () => {
    it('finds the app using identifyApp()', () => {
      expect(() => actions.identifyApp('inventory', mockNav)).not.toThrowError('unknown app identifier: inventory');
    });
  });

  describe('onPageAction', () => {
    it('should add new pageAction', () => {
      const state = reducers.onPageAction({ someState: {} }, actions.appAction('test-action'));
      expect(state).toEqual({
        someState: {},
        pageAction: 'test-action',
      });
    });

    it('should remove pageAction', () => {
      const state = reducers.onPageAction({ someState: {}, pageAction: 'test-action' }, actions.appAction());
      expect(state).toEqual({
        someState: {},
        pageAction: undefined,
      });
    });

    it('should replace pageAction', () => {
      const state = reducers.onPageAction(
        {
          someState: {},
          pageAction: 'test-action',
        },
        actions.appAction('different-action')
      );
      expect(state).toEqual({
        someState: {},
        pageAction: 'different-action',
      });
    });
  });

  describe('onPageObjectId', () => {
    it('should add new pageObjectId', () => {
      const state = reducers.onPageObjectId({ someState: {} }, actions.appObjectId('test-object-id'));
      expect(state).toEqual({
        someState: {},
        pageObjectId: 'test-object-id',
      });
    });

    it('should remove pageObjectId', () => {
      const state = reducers.onPageObjectId({ someState: {}, pageObjectId: 'test-object-id' }, actions.appObjectId());
      expect(state).toEqual({
        someState: {},
        pageObjectId: undefined,
      });
    });

    it('should replace pageObjectId', () => {
      const state = reducers.onPageObjectId(
        {
          someState: {},
          pageObjectId: 'test-object-id',
        },
        actions.appObjectId('different-object-id')
      );
      expect(state).toEqual({
        someState: {},
        pageObjectId: 'different-object-id',
      });
    });
  });

  describe.only('loadNavigationSegmentReducer', () => {
    const navigation = { test: { navItems: [], sortedLinks: [] } };
    it('should create new segment', () => {
      const newNav = {
        navItems: [
          {
            href: '/something',
          },
        ],
      };
      const result = reducers.loadNavigationSegmentReducer(
        {
          navigation: {},
        },
        {
          payload: {
            segment: 'test',
            schema: newNav,
          },
        }
      );
      expect(result).toEqual({
        navigation: {
          ...navigation,
          test: {
            ...navigation.test,
            navItems: newNav.navItems,
            sortedLinks: ['/something'],
          },
        },
      });
    });

    it('should merge two schema together', () => {
      const newNav = { navItems: [{ href: '/another' }, { href: '/different' }] };
      const result = reducers.loadNavigationSegmentReducer(
        {
          navigation: {
            ...navigation,
            test: {
              ...navigation.test,
              navItems: [{ href: '/something' }],
              sortedLinks: ['/something'],
            },
          },
        },
        {
          payload: {
            segment: 'test',
            schema: newNav,
          },
        }
      );
      expect(result).toEqual({
        navigation: {
          ...navigation,
          test: {
            ...navigation.test,
            navItems: newNav.navItems,
            sortedLinks: ['/different', '/another'],
          },
        },
      });
    });

    it('should highlight items', () => {
      const result = reducers.loadNavigationSegmentReducer(
        {
          navigation: {},
        },
        {
          payload: {
            segment: 'test',
            schema: { navItems: [{ href: '/something' }] },
            pathName: '/something',
          },
        }
      );
      console.log(result, 'this is result');
      expect(result).toEqual({
        navigation: {
          ...navigation,
          test: {
            ...navigation.test,
            navItems: [{ href: '/something', active: true }],
            sortedLinks: ['/something'],
          },
        },
      });
    });
  });
});

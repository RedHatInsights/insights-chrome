const masterConfig = require('../../../testdata/masterConfig.json');
const masterConfigPermissions = require('../../../testdata/masterConfigPermissions.json');
const navFunctions = require('./globalNav');

import * as instance from '@redhat-cloud-services/frontend-components-utilities/files/interceptors';
// eslint-disable-next-line max-len
const globalNav = {
  appA: { title: 'title1', ignoreCase: undefined, id: 'appA', routes: [{ id: 'subid1', ignoreCase: undefined, title: 'subtitle1' }] },
};

describe('globalNav', () => {
  test('should work as expected', async () => {
    expect(await navFunctions.getNavFromConfig(masterConfig, 'appA')).toEqual(globalNav);
  });
});

describe('globalNav with permissions', () => {
  test('appA', async () => {
    const calculatedNav = await navFunctions.getNavFromConfig(masterConfigPermissions, 'appA');
    expect(calculatedNav.appA.routes.length).toBe(1);
    expect(calculatedNav.appA.routes[0].id).toBe('subid2');
  });

  test('appB', async () => {
    const calculatedNav = await navFunctions.getNavFromConfig(masterConfigPermissions, 'appB');
    expect(calculatedNav.appB.routes.length).toBe(1);
    expect(calculatedNav.appB.routes[0].id).toBe('subid1');
  });

  test('appC', async () => {
    const calculatedNav = await navFunctions.getNavFromConfig(masterConfigPermissions, 'appC');
    expect(calculatedNav.appC.routes.length).toBe(1);
    expect(calculatedNav.appC.routes[0].id).toBe('subid2');
  });

  test('appD', async () => {
    const calculatedNav = await navFunctions.getNavFromConfig(masterConfigPermissions, 'appD');
    expect(calculatedNav.appD.routes.length).toBe(2);
    expect(calculatedNav.appD.routes[0].id).toBe('subid1');
    expect(calculatedNav.appD.routes[1].id).toBe('insights');
  });

  test('appF', async () => {
    const calculatedNav = await navFunctions.getNavFromConfig(masterConfigPermissions, 'appF');
    expect(calculatedNav.appF).not.toBeDefined();
  });

  test('appG, should have empty navigation', async () => {
    const calculatedNav = await navFunctions.getNavFromConfig(masterConfigPermissions, 'appG');
    expect(calculatedNav.appG).not.toBeDefined();
  });
});

describe('global nav with API restricted sub items', () => {
  const axiosSpy = jest.spyOn(instance, 'default');
  const mockEmptyMatcherAsyncNavDefinition = {
    asyncApp: {
      top_level: 'top-level',
      frontend: {
        title: 'async-app',
        sub_apps: [
          {
            id: 'sub-app-one',
            title: 'sub-app-one',
            permissions: {
              method: 'apiRequest',
              args: [{ url: '/request/url', matcher: 'isEmpty', accessor: 'data' }],
            },
          },
          {
            id: 'sub-app-two',
            title: 'sub-app-two',
          },
        ],
      },
      title: 'appF',
    },
  };

  const mockNotEmptyMatcherAsyncNavDefinition = {
    asyncApp: {
      top_level: 'top-level',
      frontend: {
        title: 'async-app',
        sub_apps: [
          {
            id: 'sub-app-one',
            title: 'sub-app-one',
            permissions: {
              method: 'apiRequest',
              args: [{ url: '/request/url', matcher: 'isNotEmpty', accessor: 'data' }],
            },
          },
          {
            id: 'sub-app-two',
            title: 'sub-app-two',
          },
        ],
      },
      title: 'appF',
    },
  };

  const mockAsyncNavDefinition = {
    asyncApp: {
      top_level: 'top-level',
      frontend: {
        title: 'async-app',
        sub_apps: [
          {
            id: 'sub-app-one',
            title: 'sub-app-one',
            permissions: {
              method: 'apiRequest',
              args: [{ url: '/request/url', foo: 'bar' }],
            },
          },
          {
            id: 'sub-app-two',
            title: 'sub-app-two',
          },
        ],
      },
      title: 'appF',
    },
  };

  afterEach(() => {
    axiosSpy.mockReset();
  });

  test('should display sub item with positive API response', async () => {
    const expectedRoutes = [
      { id: 'sub-app-one', title: 'sub-app-one' },
      { id: 'sub-app-two', title: 'sub-app-two' },
    ];
    axiosSpy.mockImplementationOnce(() => Promise.resolve(true));
    const nav = await navFunctions.getNavFromConfig(mockAsyncNavDefinition, 'asyncApp');
    expect(nav.asyncApp.routes).toEqual(expectedRoutes);
    expect(axiosSpy).toHaveBeenCalledWith({ foo: 'bar', method: 'GET', url: '/request/url' });
  });

  test('should not display sub item with negative API response', async () => {
    const expectedRoutes = [{ id: 'sub-app-two', title: 'sub-app-two' }];
    axiosSpy.mockImplementationOnce(() => Promise.resolve(false));
    const nav = await navFunctions.getNavFromConfig(mockAsyncNavDefinition, 'asyncApp');
    expect(nav.asyncApp.routes).toEqual(expectedRoutes);
    expect(axiosSpy).toHaveBeenCalledWith({ foo: 'bar', method: 'GET', url: '/request/url' });
  });

  test('should not display sub item using API response with data accessor and isEmpty matcher', async () => {
    axiosSpy.mockImplementationOnce(() => Promise.resolve({ data: [1] }));
    const expectedRoutes = [{ id: 'sub-app-two', title: 'sub-app-two' }];
    const nav = await navFunctions.getNavFromConfig(mockEmptyMatcherAsyncNavDefinition, 'asyncApp');
    expect(nav.asyncApp.routes).toEqual(expectedRoutes);
    expect(axiosSpy).toHaveBeenCalledWith({ method: 'GET', url: '/request/url' });
  });

  test('should display sub item using API response with data accessor and isEmpty matcher', async () => {
    axiosSpy.mockImplementationOnce(() => Promise.resolve({ data: [] }));
    const expectedRoutes = [
      { id: 'sub-app-one', title: 'sub-app-one' },
      { id: 'sub-app-two', title: 'sub-app-two' },
    ];
    const nav = await navFunctions.getNavFromConfig(mockEmptyMatcherAsyncNavDefinition, 'asyncApp');
    expect(nav.asyncApp.routes).toEqual(expectedRoutes);
    expect(axiosSpy).toHaveBeenCalledWith({ method: 'GET', url: '/request/url' });
  });

  test('should display sub item using API response with data accessor and isNotEmpty matcher', async () => {
    axiosSpy.mockImplementationOnce(() => Promise.resolve({ data: [1] }));
    const expectedRoutes = [
      { id: 'sub-app-one', title: 'sub-app-one' },
      { id: 'sub-app-two', title: 'sub-app-two' },
    ];
    const nav = await navFunctions.getNavFromConfig(mockNotEmptyMatcherAsyncNavDefinition, 'asyncApp');
    expect(nav.asyncApp.routes).toEqual(expectedRoutes);
    expect(axiosSpy).toHaveBeenCalledWith({ method: 'GET', url: '/request/url' });
  });

  test('should not display sub item using API response with data accessor and isNotEmpty matcher', async () => {
    axiosSpy.mockImplementationOnce(() => Promise.resolve({ data: [] }));
    const expectedRoutes = [{ id: 'sub-app-two', title: 'sub-app-two' }];
    const nav = await navFunctions.getNavFromConfig(mockNotEmptyMatcherAsyncNavDefinition, 'asyncApp');
    expect(nav.asyncApp.routes).toEqual(expectedRoutes);
    expect(axiosSpy).toHaveBeenCalledWith({ method: 'GET', url: '/request/url' });
  });
});

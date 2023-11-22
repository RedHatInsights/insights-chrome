import { RouteDefinition } from '../@types/types';
import getInitialScope from './getInitialScope';

describe('getInitialScope', () => {
  const mockRoutes: RouteDefinition[] = [
    {
      manifestLocation: 'https://some.url',
      module: 'some-module',
      path: '/some-module',
      scope: 'some-scope',
    },
    {
      manifestLocation: 'https://some.url',
      module: 'no-scoped-module',
      path: '/no-scoped-module',
      scope: 'no-scoped-module',
    },
  ];

  it('should return the scope of the first matching route', () => {
    expect(getInitialScope(mockRoutes, '/some-module')).toBe('some-scope');
  });

  it('should return the scope of the first matching route for nested routes', () => {
    expect(getInitialScope(mockRoutes, '/some-module/some-path')).toBe('some-scope');
  });

  it('should return the scope of the first matching route for nested routes with a trailing slash', () => {
    expect(getInitialScope(mockRoutes, '/some-module/some-path/')).toBe('some-scope');
  });

  it('should return undefined if no matching route is found', () => {
    expect(getInitialScope(mockRoutes, '/no-module')).toBeUndefined();
  });
});

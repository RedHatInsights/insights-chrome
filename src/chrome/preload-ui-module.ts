import { preloadModule as scalprumPreloadModule } from '@scalprum/core';
import { To, matchPath } from 'react-router-dom';
import chromeStore from '../state/chromeStore';
import { moduleRoutesAtom } from '../state/atoms/chromeModuleAtom';
import { RouteDefinition } from '../@types/types';

const preloadCache = new Map<string, RouteDefinition>();

function preloadModule(to: To) {
  try {
    const routes = chromeStore.get(moduleRoutesAtom);
    const pathname = typeof to === 'string' ? to : to.pathname;
    if (pathname) {
      let route = preloadCache.get(pathname);
      if (!route) {
        route = routes.find((r) => matchPath(r.path + '/*', pathname));
        if (route) {
          preloadCache.set(pathname, route);
        }
      }
      if (route) {
        scalprumPreloadModule(route.scope, route.module);
      }
    }
  } catch (error) {
    console.warn('Failed to preload module from link', error, to);
  }
}

export default preloadModule;

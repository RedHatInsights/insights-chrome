import React from 'react';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router';
import ChromeRoute from './ChromeRoute';

const generateRoutesList = (modules) => {
  const reactModules = Object.entries(modules)
    .reduce(
      (acc, [scope, { manifestLocation, modules = [] }]) => [
        ...acc,
        ...modules
          .map(({ module, routes }) =>
            /**Clean up this map function */
            routes.map((route) => ({
              scope,
              module,
              path: typeof route === 'string' ? route : route.pathname,
              manifestLocation,
              dynamic: typeof route === 'string' ? true : route.dynamic,
              exact: typeof route === 'string' ? false : route.exact,
            }))
          )
          .flat(),
      ],
      []
    )
    .sort((a, b) => (a.path.length < b.path.length ? 1 : -1));
  return reactModules;
};

const Routes = () => {
  const modules = useSelector(({ chrome: { modules } }) => modules);

  if (!modules) {
    return null;
  }
  const list = generateRoutesList(modules);
  return (
    <Switch>
      {list.map((app) => (
        <ChromeRoute key={app.pathname} {...app} />
      ))}
      <Route>Not found</Route>
    </Switch>
  );
};

export default Routes;

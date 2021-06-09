import React from 'react';
import { useSelector } from 'react-redux';
import { Switch } from 'react-router';
import ChromeRoute from './ChromeRoute';

const generateRoutesList = (modules) => {
  const reactModules = Object.entries(modules)
    .reduce(
      (acc, [scope, { manifestLocation, modules = [] }]) => [
        ...acc,
        ...modules
          .map(({ module, routes }) =>
            routes.map((pathname) => ({
              scope,
              module,
              pathname,
              manifestLocation,
            }))
          )
          .flat(),
      ],
      []
    )
    .sort((a, b) => (a.pathname.length < b.pathname.length ? 1 : -1));
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
    </Switch>
  );
};

export default Routes;

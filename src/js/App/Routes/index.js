import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router';
import { Redirect } from 'react-router-dom';
import ChromeRoute from './ChromeRoute';

const redirects = [
  {
    path: '/insights',
    to: '/insights/dashboard',
  },
];

const generateRoutesList = (modules) =>
  Object.entries(modules)
    .reduce(
      (acc, [scope, { dynamic, manifestLocation, modules = [] }]) => [
        ...acc,
        ...modules
          .map(({ module, routes }) =>
            /**Clean up this map function */
            routes.map((route) => ({
              scope,
              module,
              path: typeof route === 'string' ? route : route.pathname,
              manifestLocation,
              dynamic: typeof dynamic === 'boolean' ? dynamic : typeof route === 'string' ? true : route.dynamic,
              exact: typeof route === 'string' ? false : route.exact,
            }))
          )
          .flat(),
      ],
      []
    )
    .sort((a, b) => (a.path.length < b.path.length ? 1 : -1));

const Routes = ({ insightsContentRef }) => {
  const modules = useSelector(({ chrome: { modules } }) => modules);

  if (!modules) {
    return null;
  }
  const list = generateRoutesList(modules);
  return (
    <Switch>
      {redirects.map(({ path, to }) => (
        <Route key={path} exact path={path}>
          <Redirect to={to} />
        </Route>
      ))}
      {list.map((app) => (
        <ChromeRoute insightsContentRef={insightsContentRef} key={app.path} {...app} />
      ))}
      <Route>Not found</Route>
    </Switch>
  );
};

Routes.propTypes = {
  insightsContentRef: PropTypes.object,
};

export default Routes;

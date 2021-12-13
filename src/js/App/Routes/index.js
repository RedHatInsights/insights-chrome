import React, { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router';
import { Redirect } from 'react-router-dom';
import ChromeRoute from './ChromeRoute';
import NotFoundRoute from './NotFoundRoute';
import { isFedRamp } from '../../utils';
import LoadingFallback from '../../utils/loading-fallback';
const QuickstartCatalogRoute = lazy(() => import('./QuickstartsCatalogRoute'));

const redirects = [
  {
    path: '/insights',
    to: '/insights/dashboard',
  },
  {
    path: '/docs',
    to: '/api/docs',
  },
];

const generateRoutesList = (modules) =>
  Object.entries(modules)
    .reduce(
      (acc, [scope, { dynamic, manifestLocation, isFedramp, modules = [] }]) => [
        ...acc,
        ...modules
          .map(({ module, routes }) =>
            /**Clean up this map function */
            routes.map((route) => ({
              scope,
              module,
              isFedramp: typeof route === 'string' ? isFedramp : route.isFedramp,
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
  const showBundleCatalog = localStorage.getItem('chrome:experimental:quickstarts') === 'true';

  if (!modules) {
    return null;
  }
  let list = generateRoutesList(modules);

  if (isFedRamp()) {
    list = list.filter((list) => list.isFedramp);
  }

  return (
    <Switch>
      {showBundleCatalog && (
        <Route exact path="/([^\/]+)/quickstarts">
          <Suspense fallback={LoadingFallback}>
            <QuickstartCatalogRoute />
          </Suspense>
        </Route>
      )}
      {redirects.map(({ path, to }) => (
        <Route key={path} exact path={path}>
          <Redirect to={to} />
        </Route>
      ))}
      {list.map((app) => (
        <ChromeRoute insightsContentRef={insightsContentRef} key={app.path} {...app} />
      ))}
      <Route>
        <NotFoundRoute />
      </Route>
    </Switch>
  );
};

Routes.propTypes = {
  insightsContentRef: PropTypes.object,
};

export default Routes;

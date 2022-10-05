import React, { Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';
import ChromeRoute from './ChromeRoute';
import NotFoundRoute from './NotFoundRoute';
import { isFedRamp } from '../../../utils/common';
import LoadingFallback from '../../../utils/loading-fallback';
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

const Routes = ({ insightsContentRef, routesProps }) => {
  const moduleRoutes = useSelector(({ chrome: { moduleRoutes } }) => moduleRoutes);
  const showBundleCatalog = localStorage.getItem('chrome:experimental:quickstarts') === 'true';

  let list = moduleRoutes;
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
        <ChromeRoute insightsContentRef={insightsContentRef} key={app.path} {...routesProps} {...app} />
      ))}
      <Route>
        <NotFoundRoute />
      </Route>
    </Switch>
  );
};

Routes.propTypes = {
  insightsContentRef: PropTypes.object,
  routesProps: PropTypes.object,
};

export default Routes;

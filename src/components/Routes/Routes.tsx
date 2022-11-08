import React, { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';
import ChromeRoute from '../ChromeRoute/ChromeRoute';
import NotFoundRoute from '../NotFoundRoute';
import { isFedRamp } from '../../utils/common';
import LoadingFallback from '../../utils/loading-fallback';
import { ReduxState } from '../../redux/store';
import AppsServices from '../../layouts/AppsServices';

const QuickstartCatalogRoute = lazy(() => import('../QuickstartsCatalogRoute'));

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

export type RoutesProps = {
  routesProps?: { scopeClass?: string };
};

const Routes = ({ routesProps }: RoutesProps) => {
  const moduleRoutes = useSelector(({ chrome: { moduleRoutes } }: ReduxState) => moduleRoutes);
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
        <ChromeRoute key={app.path} {...routesProps} {...app} />
      ))}
      <Route path="/allappsandservices">
        <AppsServices />
      </Route>
      <Route>
        <NotFoundRoute />
      </Route>
    </Switch>
  );
};

export default Routes;

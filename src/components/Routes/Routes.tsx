import React, { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import ChromeRoute from '../ChromeRoute';
import NotFoundRoute from '../NotFoundRoute';
import LoadingFallback from '../../utils/loading-fallback';
import { ReduxState } from '../../redux/store';
import { ITLess } from '../../utils/common';

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

const ChromeRoutes = ({ routesProps }: RoutesProps) => {
  const moduleRoutes = useSelector(({ chrome: { moduleRoutes } }: ReduxState) => moduleRoutes);
  const showBundleCatalog = localStorage.getItem('chrome:experimental:quickstarts') === 'true';

  let list = moduleRoutes;
  if (ITLess()) {
    list = list.filter((list) => list.isFedramp);
  }

  return (
    <Routes>
      {showBundleCatalog && (
        <Route
          path="/([^\/]+)/quickstarts"
          element={
            <Suspense fallback={LoadingFallback}>
              <QuickstartCatalogRoute />
            </Suspense>
          }
        />
      )}
      {redirects.map(({ path, to }) => (
        <Route key={path} path={path} element={<Navigate replace to={to} />} />
      ))}
      {list.map((app) => (
        <Route key={app.path} path={app.absolute ? app.path : `${app.path}/*`} element={<ChromeRoute {...routesProps} {...app} />} />
      ))}
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
};

export default ChromeRoutes;

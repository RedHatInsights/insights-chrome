import React, { Suspense, lazy, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import ChromeRoute from '../ChromeRoute';
import NotFoundRoute from '../NotFoundRoute';
import LoadingFallback from '../../utils/loading-fallback';
import { ReduxState } from '../../redux/store';
import { useFlag } from '@unleash/proxy-client-react';

const INTEGRATION_SOURCES = 'platform.sources.integrations';

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
  {
    path: '/settings',
    to: '/settings/integrations',
    featureFlag: {
      value: true,
      name: INTEGRATION_SOURCES,
    },
  },
  {
    path: '/settings',
    to: '/settings/sources',
    featureFlag: {
      value: false,
      name: INTEGRATION_SOURCES,
    },
  },
  {
    path: '/user-preferences',
    to: '/user-preferences/notifications',
  },
  {
    path: '/quay',
    to: '/quay/organization',
  },
  {
    path: '/hac',
    to: '/hac/application-pipeline',
  },
  {
    path: '/subscriptions',
    to: '/subscriptions/overview',
  },
  {
    path: '/business-services',
    to: '/business-services/hybrid-committed-spend',
  },
  {
    path: '/docs',
    to: '/docs/api',
  },
];

export type RoutesProps = {
  routesProps?: { scopeClass?: string };
};

const ChromeRoutes = ({ routesProps }: RoutesProps) => {
  const enableIntegrations = useFlag(INTEGRATION_SOURCES);
  const featureFlags = useMemo<Record<string, boolean>>(() => ({ INTEGRATION_SOURCES: enableIntegrations }), [enableIntegrations]);
  const moduleRoutes = useSelector(({ chrome: { moduleRoutes } }: ReduxState) => moduleRoutes);
  const showBundleCatalog = localStorage.getItem('chrome:experimental:quickstarts') === 'true';

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
      {redirects.map(({ path, to, featureFlag }) => {
        if (featureFlag) {
          const found = Object.keys(featureFlags).find((item) => item === featureFlag.name);
          if (featureFlags[found as string] !== featureFlag.value) {
            return null;
          }
        }
        return <Route key={path} path={path} element={<Navigate replace to={to} />} />;
      })}
      {moduleRoutes.map((app) => (
        <Route key={app.path} path={app.absolute ? app.path : `${app.path}/*`} element={<ChromeRoute {...routesProps} {...app} />} />
      ))}
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
};

export default ChromeRoutes;

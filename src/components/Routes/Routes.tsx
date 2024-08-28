import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ChromeRoute from '../ChromeRoute';
import NotFoundRoute from '../NotFoundRoute';
import LoadingFallback from '../../utils/loading-fallback';
import { useFlag } from '@unleash/proxy-client-react';
import { useAtomValue } from 'jotai';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';
import useTrialRedirect from '../../hooks/useTrialRedirect';
import { initializeViteFederation } from './webpack-vite-bridge';

const INTEGRATION_SOURCES = 'platform.sources.integrations';

const QuickstartCatalogRoute = lazy(() => import('../QuickstartsCatalogRoute'));
const ModularInventoryRoute = lazy(() => import('../../inventoryPoc'));

const redirects = [
  {
    path: '/insights',
    to: '/insights/dashboard',
  },
  {
    path: '/docs',
    to: '/docs/api',
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
    path: '/docs',
    to: '/docs/api',
  },
];

export type RoutesProps = {
  routesProps?: { scopeClass?: string };
};

const viteManifest = {
  name: 'landing',
  version: '1.0.0',
  extensions: [],
  registrationMethod: 'custom',
  baseURL: '/apps/landing/',
  loadScripts: ['landing-entry.js'],
  buildHash: '21a3e56fe043c40e5149451bbd2d6c86',
};

const loadViteModule = async (remote: string, module: string) => {
  if (!globalThis.__federation__) {
    throw new Error('Vite dynamic module federation was not initialized!');
  }
  await globalThis.__federation__.ensure(remote, `./${module}`);
  if (
    !globalThis.__federation__.remotesMap[remote] ||
    !globalThis.__federation__.remotesMap[remote]?.loaded ||
    !globalThis.__federation__.remotesMap[remote].lib
  ) {
    throw new Error(`Trying to access Vite remote ${remote} before initialization.`);
  }

  const c = await globalThis.__federation__.remotesMap[remote].lib!.get(`./${module}`);
  return c();
};

const ViteRemoteRoute = () => {
  const [C, setC] = React.useState<any>(null);
  useEffect(() => {
    initializeViteFederation('chrome', 'default', {
      landing: {
        url: viteManifest.baseURL + 'landing-entry.js',
        format: 'esm',
        loaded: false,
      },
    });
    const C = loadViteModule('landing', 'RootApp');
    // should be able to use this with lazy, mfe experiments has proper implementation
    C.then((m) => {
      console.log('CD', m.default);
      setC(m.default);
    });
  }, []);
  if (C) {
    return <Suspense fallback="Foo">{C}</Suspense>;
  }
  return <div>Remote Route</div>;
};

const ChromeRoutes = ({ routesProps }: RoutesProps) => {
  const enableIntegrations = useFlag(INTEGRATION_SOURCES);
  const enableInventoryPOC = useFlag('platform.chrome.poc.inventory');
  const featureFlags = useMemo<Record<string, boolean>>(() => ({ INTEGRATION_SOURCES: enableIntegrations }), [enableIntegrations]);
  const moduleRoutes = useAtomValue(moduleRoutesAtom);
  const showBundleCatalog = localStorage.getItem('chrome:experimental:quickstarts') === 'true';
  useTrialRedirect();

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
      {/* to test vite integration */}
      {/* <Route path="/" element={<ViteRemoteRoute />} /> */}
      {moduleRoutes.map((app) => (
        <Route key={app.path} path={app.absolute ? app.path : `${app.path}/*`} element={<ChromeRoute {...routesProps} {...app} />} />
      ))}
      {/* Inventory POC route only available for certain accounts */}
      {enableInventoryPOC ? (
        <Route
          path="/staging/modular-inventory"
          element={
            <Suspense fallback={LoadingFallback}>
              <ModularInventoryRoute />
            </Suspense>
          }
        />
      ) : null}
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
};

export default ChromeRoutes;

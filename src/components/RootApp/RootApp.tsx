import { Suspense, memo, useContext, useEffect } from 'react';
import { unstable_HistoryRouter as HistoryRouter, HistoryRouterProps } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import chromeHistory from '../../utils/chromeHistory';
import { FeatureFlagsProvider } from '../FeatureFlags';
import ScalprumRoot from './ScalprumRoot';
import SegmentProvider from '../../analytics/SegmentProvider';
import { ITLess, chunkLoadErrorRefreshKey } from '../../utils/common';
import { lazyWithRetry } from '../../utils/chunkLoadErrorUtils';
import useUserSSOScopes from '../../hooks/useUserSSOScopes';
import { DeepRequired } from 'utility-types';
import ReactDOM from 'react-dom';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { scalprumConfigAtom } from '../../state/atoms/scalprumConfigAtom';
import { useInitVisibleBundles } from '../../state/atoms/visibleBundlesAtom';
import { isDebuggerEnabledAtom } from '../../state/atoms/debuggerModalatom';

const NotEntitledModal = lazyWithRetry(() => import('../NotEntitledModal'));
const Debugger = lazyWithRetry(() => import('../Debugger'));

const VisibleBundlesInitializer = () => {
  useInitVisibleBundles();
  return null;
};

const RootApp = memo(() => {
  const config = useAtomValue(scalprumConfigAtom);
  const activeModule = useAtomValue(activeModuleAtom);

  useEffect(() => {
    if (activeModule) {
      let timeout: NodeJS.Timeout;
      const moduleStorageKey = `${chunkLoadErrorRefreshKey}-${activeModule}`;
      if (localStorage.getItem(moduleStorageKey) === 'true') {
        timeout = setTimeout(() => {
          localStorage.removeItem(moduleStorageKey);
        }, 10_000);
      }
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [activeModule]);

  return (
    <HistoryRouter history={chromeHistory as unknown as HistoryRouterProps['history']}>
      <SegmentProvider>
        <FeatureFlagsProvider>
          <VisibleBundlesInitializer />
          <Suspense fallback={null}>
            <NotEntitledModal />
          </Suspense>
          <ScalprumRoot config={config} />
        </FeatureFlagsProvider>
      </SegmentProvider>
    </HistoryRouter>
  );
});

RootApp.displayName = 'MemoizedRootApp';

const AuthRoot = () => {
  const { user, login } = useContext(ChromeAuthContext) as DeepRequired<ChromeAuthContextValue>;
  const isDebuggerEnabled = useAtomValue(isDebuggerEnabledAtom);

  // verify use loged in scopes
  useUserSSOScopes(login);
  return (
    <>
      <Suspense fallback={null}>
        {user?.identity?.account_number && !ITLess() && isDebuggerEnabled && ReactDOM.createPortal(<Debugger user={user} />, document.body)}
      </Suspense>
      <RootApp />
    </>
  );
};

export default AuthRoot;

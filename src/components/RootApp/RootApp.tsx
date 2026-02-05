import React, { Suspense, lazy, memo, useContext, useEffect, useMemo } from 'react';
import { unstable_HistoryRouter as HistoryRouter, HistoryRouterProps } from 'react-router-dom';
import { HelpTopicContainer, QuickStart } from '@patternfly/quickstarts';
import { useAtomValue } from 'jotai';
import { useLoadModule, useRemoteHook } from '@scalprum/react-core';
import chromeHistory from '../../utils/chromeHistory';
import { FeatureFlagsProvider } from '../FeatureFlags';
import ScalprumRoot from './ScalprumRoot';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';
import useHelpTopicState from '../QuickStart/useHelpTopicState';
import SegmentProvider from '../../analytics/SegmentProvider';
import { ITLess, chunkLoadErrorRefreshKey } from '../../utils/common';
import useUserSSOScopes from '../../hooks/useUserSSOScopes';
import { DeepRequired } from 'utility-types';
import ReactDOM from 'react-dom';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { scalprumConfigAtom } from '../../state/atoms/scalprumConfigAtom';
import { isDebuggerEnabledAtom } from '../../state/atoms/debuggerModalatom';

const NotEntitledModal = lazy(() => import('../NotEntitledModal'));
const Debugger = lazy(() => import('../Debugger'));

// Type for the useQuickstartsStore hook from learning-resources
interface QuickstartsStoreHook {
  setQuickstarts: (app: string, quickstarts: QuickStart[]) => void;
  addQuickstart: (app: string, quickstart: QuickStart) => void;
  activateQuickstart: (name: string) => Promise<void>;
  setActiveQuickStartID: (id: string) => void;
  clearQuickstarts: (activeQuickStartID?: string) => void;
}

const RootApp = memo(({ accountId }: { accountId?: string }) => {
  const config = useAtomValue(scalprumConfigAtom);
  const { helpTopics, addHelpTopics, disableTopics, enableTopics } = useHelpTopicState();
  const activeModule = useAtomValue(activeModuleAtom);

  // Load QuickStartProvider from learning-resources
  const [quickStartProviderModule, quickStartProviderError] = useLoadModule(
    {
      scope: 'learningResources',
      module: './QuickStartProvider',
    },
    undefined
  );
  const QuickStartProvider = quickStartProviderModule as React.FC<{ children: React.ReactNode; accountId?: string }> | undefined;

  // Load useQuickstartsStore from learning-resources for the deprecated API
  const { hookResult: useQuickstartsStore } = useRemoteHook<() => QuickstartsStoreHook>({
    scope: 'learningResources',
    module: './quickstarts/useQuickstartsStore',
  });

  // Get store functions for deprecated API (only if hook is loaded)
  const store = useQuickstartsStore?.() ?? null;

  useEffect(() => {
    if (store && activeModule) {
      store.clearQuickstarts();
      let timeout: NodeJS.Timeout;
      const moduleStorageKey = `${chunkLoadErrorRefreshKey}-${activeModule}`;
      if (localStorage.getItem(moduleStorageKey) === 'true') {
        // The localStorage should either be true or null. A false value
        // can cause infinite loops. The timeout will remove the value after
        // ten seconds
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
  }, [activeModule, store]);

  const helpTopicsAPI = {
    addHelpTopics,
    disableTopics,
    enableTopics,
  };

  const quickstartsAPI = useMemo(
    () => ({
      version: 1,
      /**
       * @deprecated Use useQuickstartsStore from 'learning-resources/quickstarts/useQuickstartsStore' instead.
       * This method will be removed in a future version.
       */
      set: (key: string, qs: QuickStart[]) => {
        console.warn('chrome.quickStarts.set is deprecated. Use useQuickstartsStore from "learning-resources/quickstarts/useQuickstartsStore" instead.');
        store?.setQuickstarts(key, qs);
      },
      /**
       * @deprecated Use useQuickstartsStore from 'learning-resources/quickstarts/useQuickstartsStore' instead.
       * This method will be removed in a future version.
       */
      activateQuickstart: async (name: string) => {
        console.warn(
          'chrome.quickStarts.activateQuickstart is deprecated. Use useQuickstartsStore from "learning-resources/quickstarts/useQuickstartsStore" instead.'
        );
        return store?.activateQuickstart(name);
      },
      /**
       * @deprecated Use useQuickstartsStore from 'learning-resources/quickstarts/useQuickstartsStore' instead.
       * This method will be removed in a future version.
       */
      add: (key: string, qs: QuickStart) => {
        console.warn('chrome.quickStarts.add is deprecated. Use useQuickstartsStore from "learning-resources/quickstarts/useQuickstartsStore" instead.');
        store?.addQuickstart(key, qs);
        return true;
      },
      /**
       * @deprecated Use useQuickstartsStore from 'learning-resources/quickstarts/useQuickstartsStore' instead.
       * This method will be removed in a future version.
       */
      toggle: (id: string) => {
        console.warn('chrome.quickStarts.toggle is deprecated. Use useQuickstartsStore from "learning-resources/quickstarts/useQuickstartsStore" instead.');
        store?.setActiveQuickStartID(id);
      },
      Catalog: LazyQuickStartCatalog,
      /**
       * @deprecated Use useQuickstartsStore from 'learning-resources/quickstarts/useQuickstartsStore' instead.
       * This method will be removed in a future version.
       */
      updateQuickStarts: (key: string, qs: QuickStart[]) => {
        console.warn(
          'chrome.quickStarts.updateQuickStarts is deprecated. Use useQuickstartsStore from "learning-resources/quickstarts/useQuickstartsStore" instead.'
        );
        store?.setQuickstarts(key, qs);
      },
    }),
    [store]
  );

  // Render content with or without QuickStartProvider depending on load status
  const renderContent = (children: React.ReactNode) => {
    if (quickStartProviderError) {
      return children;
    }
    if (!QuickStartProvider) {
      return children;
    }
    return <QuickStartProvider accountId={accountId}>{children}</QuickStartProvider>;
  };

  return (
    <HistoryRouter history={chromeHistory as unknown as HistoryRouterProps['history']}>
      <SegmentProvider>
        <FeatureFlagsProvider>
          {/* <CrossRequestNotifier /> */}
          <Suspense fallback={null}>
            <NotEntitledModal />
          </Suspense>
          <Suspense fallback={null}></Suspense>
          {renderContent(
            <HelpTopicContainer helpTopics={helpTopics}>
              <ScalprumRoot config={config} quickstartsAPI={quickstartsAPI} helpTopicsAPI={helpTopicsAPI} />
            </HelpTopicContainer>
          )}
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
      <RootApp accountId={user?.identity?.internal?.account_id} />
    </>
  );
};

export default AuthRoot;

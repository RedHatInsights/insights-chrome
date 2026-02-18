import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useLoadModule, useRemoteHook } from '@scalprum/react-core';
import { QuickStart } from '@patternfly/quickstarts';
import { useAtomValue } from 'jotai';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';
import { QuickstartsApi } from '../../@types/types';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { chunkLoadErrorRefreshKey } from '../../utils/common';

// Type for the useQuickstartsStore hook from learning-resources
interface QuickstartsStoreHook {
  setQuickstarts: (app: string, quickstarts: QuickStart[]) => void;
  addQuickstart: (app: string, quickstart: QuickStart) => void;
  activateQuickstart: (name: string) => Promise<void>;
  setActiveQuickStartID: (id: string) => void;
  clearQuickstarts: (activeQuickStartID?: string) => void;
}

// Context for passing quickstartsAPI to ChromeApiRoot
export const QuickstartsAPIContext = createContext<QuickstartsApi | null>(null);

// Hook to consume the quickstartsAPI context
export const useQuickstartsAPI = () => {
  const api = useContext(QuickstartsAPIContext);
  if (!api) {
    throw new Error('useQuickstartsAPI must be used within QuickStartsWrapper');
  }
  return api;
};

export interface QuickStartsWrapperProps {
  children: React.ReactNode;
  accountId?: string;
}

/**
 * Creates a deprecated API wrapper that logs a warning before calling the underlying function.
 */
const deprecated = <Args extends unknown[], R>(message: string, fn: ((...args: Args) => R) | undefined) => {
  return (...args: Args): R | undefined => {
    console.warn(message);
    return fn?.(...args);
  };
};

/**
 * Clears quickstarts and handles chunk load error cleanup when the active module changes.
 */
const useChunkLoadErrorReset = (store: QuickstartsStoreHook | null, activeModule: string | undefined) => {
  useEffect(() => {
    if (!store || !activeModule) {
      return;
    }

    store.clearQuickstarts();

    let timeout: NodeJS.Timeout | undefined;
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
  }, [store, activeModule]);
};

const QuickStartsWrapper: React.FC<QuickStartsWrapperProps> = ({ children, accountId }) => {
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
  const { hookResult: useQuickstartsStoreModule } = useRemoteHook<{ default: () => QuickstartsStoreHook }>({
    scope: 'learningResources',
    module: './quickstarts/useQuickstartsStore',
  });

  // Handle default export - the module returns { default: function }
  const useQuickstartsStore = useQuickstartsStoreModule?.default;

  // Get store functions for deprecated API (only if hook is loaded)
  const store = useQuickstartsStore?.() ?? null;

  // Handle chunk load error cleanup when the active module changes
  useChunkLoadErrorReset(store, activeModule);

  const DEPRECATION_MESSAGE = 'Use useQuickstartsStore from "learning-resources/quickstarts/useQuickstartsStore" instead.';

  const quickstartsAPI: QuickstartsApi = useMemo(
    () => ({
      version: 1,
      /** @deprecated Use useQuickstartsStore from 'learning-resources/quickstarts/useQuickstartsStore' instead. */
      set: deprecated(
        `chrome.quickStarts.set is deprecated. ${DEPRECATION_MESSAGE}`,
        store ? (key: string, qs: QuickStart[]) => store.setQuickstarts(key, qs) : undefined
      ),
      /** @deprecated Use useQuickstartsStore from 'learning-resources/quickstarts/useQuickstartsStore' instead. */
      activateQuickstart: async (name: string) => {
        console.warn(`chrome.quickStarts.activateQuickstart is deprecated. ${DEPRECATION_MESSAGE}`);
        return store?.activateQuickstart(name) ?? Promise.resolve();
      },
      /** @deprecated Use useQuickstartsStore from 'learning-resources/quickstarts/useQuickstartsStore' instead. */
      add: deprecated(
        `chrome.quickStarts.add is deprecated. ${DEPRECATION_MESSAGE}`,
        store
          ? (key: string, qs: QuickStart) => {
              store.addQuickstart(key, qs);
              return true;
            }
          : undefined
      ),
      /** @deprecated Use useQuickstartsStore from 'learning-resources/quickstarts/useQuickstartsStore' instead. */
      toggle: deprecated(
        `chrome.quickStarts.toggle is deprecated. ${DEPRECATION_MESSAGE}`,
        store ? (id: string) => store.setActiveQuickStartID(id) : undefined
      ),
      Catalog: LazyQuickStartCatalog,
      /** @deprecated Use useQuickstartsStore from 'learning-resources/quickstarts/useQuickstartsStore' instead. */
      updateQuickStarts: deprecated(
        `chrome.quickStarts.updateQuickStarts is deprecated. ${DEPRECATION_MESSAGE}`,
        store ? (key: string, qs: QuickStart[]) => store.setQuickstarts(key, qs) : undefined
      ),
    }),
    [store]
  );

  return (
    <QuickstartsAPIContext.Provider value={quickstartsAPI}>
      {quickStartProviderError || !QuickStartProvider ? children : <QuickStartProvider accountId={accountId}>{children}</QuickStartProvider>}
    </QuickstartsAPIContext.Provider>
  );
};

export default QuickStartsWrapper;

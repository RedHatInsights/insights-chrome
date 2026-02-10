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

  const quickstartsAPI: QuickstartsApi = useMemo(
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
  const renderContent = (content: React.ReactNode) => {
    if (quickStartProviderError) {
      return content;
    }
    if (!QuickStartProvider) {
      return content;
    }
    return <QuickStartProvider accountId={accountId}>{content}</QuickStartProvider>;
  };

  return <QuickstartsAPIContext.Provider value={quickstartsAPI}>{renderContent(children)}</QuickstartsAPIContext.Provider>;
};

export default QuickStartsWrapper;

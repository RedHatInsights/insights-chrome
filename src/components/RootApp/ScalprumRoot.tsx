import React, { Suspense, lazy, memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { ScalprumProvider, ScalprumProviderProps } from '@scalprum/react-core';
import { shallowEqual, useSelector, useStore } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import { HelpTopic, HelpTopicContext } from '@patternfly/quickstarts';
import { AppsConfig } from '@scalprum/core';
import { ChromeAPI, EnableTopicsArgs } from '@redhat-cloud-services/types';
import { ChromeProvider } from '@redhat-cloud-services/chrome';
import { useAtomValue, useSetAtom } from 'jotai';

import chromeHistory from '../../utils/chromeHistory';
import DefaultLayout from '../../layouts/DefaultLayout';
import AllServices from '../../layouts/AllServices';
import FavoritedServices from '../../layouts/FavoritedServices';
import historyListener from '../../utils/historyListener';
import SegmentContext from '../../analytics/SegmentContext';
import LoadingFallback from '../../utils/loading-fallback';
import { ReduxState } from '../../redux/store';
import { FlagTagsFilter, HelpTopicsAPI, QuickstartsApi } from '../../@types/types';
import { createChromeContext } from '../../chrome/create-chrome';
import Navigation from '../Navigation';
import useHelpTopicManager from '../QuickStart/useHelpTopicManager';
import ChromeFooter from '../Footer/Footer';
import updateSharedScope from '../../chrome/update-shared-scope';
import useBundleVisitDetection from '../../hooks/useBundleVisitDetection';
import chromeApiWrapper from './chromeApiWrapper';
import { ITLess } from '../../utils/common';
import InternalChromeContext from '../../utils/internalChromeContext';
import useChromeServiceEvents from '../../hooks/useChromeServiceEvents';
import useTrackPendoUsage from '../../hooks/useTrackPendoUsage';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { onRegisterModuleWriteAtom } from '../../state/atoms/chromeModuleAtom';
import useTabName from '../../hooks/useTabName';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { addNavListenerAtom, deleteNavListenerAtom } from '../../state/atoms/activeAppAtom';
import BetaSwitcher from '../BetaSwitcher';
import useHandlePendoScopeUpdate from '../../hooks/useHandlePendoScopeUpdate';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';

const ProductSelection = lazy(() => import('../Stratosphere/ProductSelection'));

const useGlobalFilter = (callback: (selectedTags?: FlagTagsFilter) => any) => {
  const selectedTags = useSelector(({ globalFilter: { selectedTags } }: ReduxState) => selectedTags, shallowEqual);
  return callback(selectedTags);
};

const ScalprumRoot = memo(
  () => {
    return (
      <ChromeProvider>
        <BetaSwitcher />
        <Routes>
          <Route index path="/" element={<DefaultLayout Footer={<ChromeFooter />} />} />
          <Route
            path="/connect/products"
            element={
              <Suspense fallback={LoadingFallback}>
                <ProductSelection />
              </Suspense>
            }
          />
          <Route
            path="/allservices"
            element={
              <Suspense fallback={LoadingFallback}>
                <AllServices Footer={<ChromeFooter />} />
              </Suspense>
            }
          />
          {!ITLess() && (
            <Route
              path="/favoritedservices"
              element={
                <Suspense fallback={LoadingFallback}>
                  <FavoritedServices Footer={<ChromeFooter />} />
                </Suspense>
              }
            />
          )}
          <Route path="/security" element={<DefaultLayout />} />
          <Route path="*" element={<DefaultLayout Sidebar={Navigation} />} />
        </Routes>
      </ChromeProvider>
    );
    // no props, no need to ever render based on parent changes
  },
  () => true
);

ScalprumRoot.displayName = 'MemoizedScalprumRoot';

export type ChromeApiRootProps = {
  config: AppsConfig;
  helpTopicsAPI: HelpTopicsAPI;
  quickstartsAPI: QuickstartsApi;
};

const ChromeApiRoot = ({ config, helpTopicsAPI, quickstartsAPI }: ChromeApiRootProps) => {
  const chromeAuth = useContext(ChromeAuthContext);
  const mutableChromeApi = useRef<ChromeAPI>();
  const isPreview = useAtomValue(isPreviewAtom);
  const addNavListener = useSetAtom(addNavListenerAtom);
  const deleteNavListener = useSetAtom(deleteNavListenerAtom);
  const { setFilteredHelpTopics } = useContext(HelpTopicContext);
  const internalFilteredTopics = useRef<HelpTopic[]>([]);
  const { analytics } = useContext(SegmentContext);
  const registerModule = useSetAtom(onRegisterModuleWriteAtom);
  const store = useStore<ReduxState>();
  const activeModule = useAtomValue(activeModuleAtom);

  // initialize WS event handling
  const addWsEventListener = useChromeServiceEvents();

  // track bundle visits
  useBundleVisitDetection(chromeAuth.user?.identity?.internal?.org_id);

  // track pendo usage
  useTrackPendoUsage();
  // update pendo data on scope change
  useHandlePendoScopeUpdate(chromeAuth.user, activeModule);
  // setting default tab title
  useTabName();

  useEffect(() => {
    // prepare webpack module sharing scope overrides
    updateSharedScope();
    const unregister = chromeHistory.listen(historyListener);
    return () => {
      if (typeof unregister === 'function') {
        return unregister();
      }
    };
  }, []);

  const setPageMetadata = useCallback((pageOptions: any) => {
    window._segment = {
      ...window._segment,
      pageOptions,
    };
  }, []);

  const { setActiveTopic } = useHelpTopicManager(helpTopicsAPI);

  function isStringArray(arr: EnableTopicsArgs): arr is string[] {
    return typeof arr[0] === 'string';
  }
  async function enableTopics(...names: EnableTopicsArgs) {
    let internalNames: string[] = [];
    let shouldAppend = false;
    if (isStringArray(names)) {
      internalNames = names;
    } else {
      internalNames = names[0].names;
      shouldAppend = !!names[0].append;
    }
    return helpTopicsAPI.enableTopics(...internalNames).then((res) => {
      internalFilteredTopics.current = shouldAppend
        ? [...internalFilteredTopics.current, ...res.filter((topic) => !internalFilteredTopics.current.find(({ name }) => name === topic.name))]
        : res;
      setFilteredHelpTopics?.(internalFilteredTopics.current);
      return res;
    });
  }

  function disableTopics(...topicsNames: string[]) {
    helpTopicsAPI.disableTopics(...topicsNames);
    internalFilteredTopics.current = internalFilteredTopics.current.filter((topic) => !topicsNames.includes(topic.name));
    setFilteredHelpTopics?.(internalFilteredTopics.current);
  }

  const helpTopicsChromeApi = useMemo(
    () => ({
      ...helpTopicsAPI,
      setActiveTopic,
      enableTopics,
      disableTopics,
      closeHelpTopic: () => {
        setActiveTopic('');
      },
    }),
    []
  );

  useMemo(() => {
    mutableChromeApi.current = createChromeContext({
      analytics: analytics!,
      helpTopics: helpTopicsChromeApi,
      quickstartsAPI,
      useGlobalFilter,
      store,
      setPageMetadata,
      chromeAuth,
      registerModule,
      isPreview,
      addNavListener,
      deleteNavListener,
      addWsEventListener,
    });
  }, [isPreview]);

  if (!mutableChromeApi.current) {
    return null;
  }

  const scalprumProviderProps: ScalprumProviderProps<{ chrome: ChromeAPI }> = useMemo(() => {
    if (!mutableChromeApi.current) {
      throw new Error('Chrome API failed to initialize.');
    }
    // set the deprecated chrome API to window
    // eslint-disable-next-line rulesdir/no-chrome-api-call-from-window
    window.insights.chrome = chromeApiWrapper(mutableChromeApi.current);
    return {
      config,
      api: {
        chrome: mutableChromeApi.current,
      },
      pluginSDKOptions: {
        pluginLoaderOptions: {
          // sharedScope: scope,
          transformPluginManifest: (manifest) => {
            if (manifest.name === 'chrome') {
              return {
                ...manifest,
                // Do not include chrome chunks in manifest for chrome. It will result in an infinite loading loop
                // window.chrome always exists because chrome container is always initialized
                loadScripts: [],
              };
            }
            const newManifest = {
              ...manifest,
              // Compatibility required for bot pure SDK plugins, HCC plugins and sdk v1/v2 plugins until all are on the same system.
              baseURL: manifest.name.includes('hac-') && !manifest.baseURL ? `${isPreview ? '/beta' : ''}/api/plugins/${manifest.name}/` : '/',
              loadScripts: manifest.loadScripts?.map((script) => `${manifest.baseURL}${script}`.replace(/\/\//, '/')) ?? [
                `${manifest.baseURL ?? ''}plugin-entry.js`,
              ],
              registrationMethod: manifest.registrationMethod ?? 'callback',
            };
            return newManifest;
          },
        },
      },
    };
  }, [isPreview]);

  return (
    <InternalChromeContext.Provider value={mutableChromeApi.current}>
      <ScalprumProvider
        config={scalprumProviderProps.config}
        api={scalprumProviderProps.api}
        pluginSDKOptions={scalprumProviderProps.pluginSDKOptions}
      >
        <ScalprumRoot />
      </ScalprumProvider>
    </InternalChromeContext.Provider>
  );
};

export default ChromeApiRoot;

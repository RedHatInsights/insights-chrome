import React, { Suspense, lazy, memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { ScalprumProvider, ScalprumProviderProps } from '@scalprum/react-core';
import { shallowEqual, useSelector, useStore } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import { HelpTopic, HelpTopicContext } from '@patternfly/quickstarts';
import isEqual from 'lodash/isEqual';
import { AppsConfig } from '@scalprum/core';
import { ChromeAPI, EnableTopicsArgs } from '@redhat-cloud-services/types';
import { ChromeProvider } from '@redhat-cloud-services/chrome';
import { useAtomValue, useSetAtom } from 'jotai';

import chromeHistory from '../../utils/chromeHistory';
import DefaultLayout from '../../layouts/DefaultLayout';
import AllServices from '../../layouts/AllServices';
import FavoritedServices from '../../layouts/FavoritedServices';
import SatelliteToken from '../../layouts/SatelliteToken';
import historyListener from '../../utils/historyListener';
import SegmentContext from '../../analytics/SegmentContext';
import LoadingFallback from '../../utils/loading-fallback';
import { ReduxState } from '../../redux/store';
import { FlagTagsFilter, HelpTopicsAPI, QuickstartsApi } from '../../@types/types';
import { createChromeContext } from '../../chrome/create-chrome';
import Navigation from '../Navigation';
import useHelpTopicManager from '../QuickStart/useHelpTopicManager';
import Footer, { FooterProps } from '../Footer/Footer';
import updateSharedScope from '../../chrome/update-shared-scope';
import useBundleVisitDetection from '../../hooks/useBundleVisitDetection';
import chromeApiWrapper from './chromeApiWrapper';
import { ITLess, getSevenDaysAgo } from '../../utils/common';
import InternalChromeContext from '../../utils/internalChromeContext';
import useChromeServiceEvents from '../../hooks/useChromeServiceEvents';
import useTrackPendoUsage from '../../hooks/useTrackPendoUsage';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { onRegisterModuleWriteAtom } from '../../state/atoms/chromeModuleAtom';
import useTabName from '../../hooks/useTabName';
import { NotificationData, notificationDrawerDataAtom } from '../../state/atoms/notificationDrawerAtom';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { addNavListenerAtom, deleteNavListenerAtom } from '../../state/atoms/activeAppAtom';

const ProductSelection = lazy(() => import('../Stratosphere/ProductSelection'));

const useGlobalFilter = (callback: (selectedTags?: FlagTagsFilter) => any) => {
  const selectedTags = useSelector(({ globalFilter: { selectedTags } }: ReduxState) => selectedTags, shallowEqual);
  return callback(selectedTags);
};

export type ScalprumRootProps = FooterProps & {
  config: AppsConfig;
  helpTopicsAPI: HelpTopicsAPI;
  quickstartsAPI: QuickstartsApi;
};

const ScalprumRoot = memo(
  ({ config, helpTopicsAPI, quickstartsAPI, cookieElement, setCookieElement, ...props }: ScalprumRootProps) => {
    const { setFilteredHelpTopics } = useContext(HelpTopicContext);
    const internalFilteredTopics = useRef<HelpTopic[]>([]);
    const { analytics } = useContext(SegmentContext);
    const chromeAuth = useContext(ChromeAuthContext);
    const registerModule = useSetAtom(onRegisterModuleWriteAtom);
    const populateNotifications = useSetAtom(notificationDrawerDataAtom);
    const isPreview = useAtomValue(isPreviewAtom);
    const addNavListener = useSetAtom(addNavListenerAtom);
    const deleteNavListener = useSetAtom(deleteNavListenerAtom);

    const store = useStore<ReduxState>();
    const mutableChromeApi = useRef<ChromeAPI>();

    // initialize WS event handling
    useChromeServiceEvents();
    // track pendo usage
    useTrackPendoUsage();
    // setting default tab title
    useTabName();

    async function getNotifications() {
      try {
        const { data } = await axios.get<{ data: NotificationData[] }>(`/api/notifications/v1/notifications/drawer`, {
          params: {
            limit: 50,
            sort_by: 'read:asc',
            startDate: getSevenDaysAgo(),
          },
        });
        populateNotifications(data?.data || []);
      } catch (error) {
        console.error('Unable to get Notifications ', error);
      }
    }

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

    // track bundle visits
    useBundleVisitDetection();

    useEffect(() => {
      // prepare webpack module sharing scope overrides
      updateSharedScope();
      // get notifications drawer api
      getNotifications();
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
      });
      // reset chrome object after token (user) updates/changes
    }, [chromeAuth.token, isPreview]);

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
    }, [chromeAuth.token, isPreview]);

    if (!mutableChromeApi.current) {
      return null;
    }

    return (
      /**
       * Once all applications are migrated to chrome 2:
       * - define chrome API in chrome root after it mounts
       * - copy these functions to window
       * - add deprecation warning to the window functions
       */
      <InternalChromeContext.Provider value={mutableChromeApi.current}>
        <ScalprumProvider {...scalprumProviderProps}>
          <ChromeProvider>
            <Routes>
              <Route
                index
                path="/"
                element={<DefaultLayout Footer={<Footer setCookieElement={setCookieElement} cookieElement={cookieElement} />} {...props} />}
              />
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
                    <AllServices Footer={<Footer setCookieElement={setCookieElement} cookieElement={cookieElement} />} />
                  </Suspense>
                }
              />
              {!ITLess() && (
                <Route
                  path="/favoritedservices"
                  element={
                    <Suspense fallback={LoadingFallback}>
                      <FavoritedServices Footer={<Footer setCookieElement={setCookieElement} cookieElement={cookieElement} />} />
                    </Suspense>
                  }
                />
              )}
              {ITLess() && <Route path="/insights/satellite" element={<SatelliteToken />} />}
              <Route path="/security" element={<DefaultLayout {...props} />} />
              <Route path="*" element={<DefaultLayout Sidebar={Navigation} {...props} />} />
            </Routes>
          </ChromeProvider>
        </ScalprumProvider>
      </InternalChromeContext.Provider>
    );
  },
  // config rarely changes
  (prev, next) => isEqual(prev.config, next.config)
);

ScalprumRoot.displayName = 'MemoizedScalprumRoot';

export default ScalprumRoot;

import React, { Suspense, lazy, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ScalprumProvider, ScalprumProviderProps } from '@scalprum/react-core';
import { shallowEqual, useSelector, useStore } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import { HelpTopic, HelpTopicContext } from '@patternfly/quickstarts';
import isEqual from 'lodash/isEqual';
import { AppsConfig } from '@scalprum/core';
import { ChromeAPI, EnableTopicsArgs } from '@redhat-cloud-services/types';

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
import { createGetUser } from '../../auth';
import LibtJWTContext from '../LibJWTContext';
import { createChromeContext } from '../../chrome/create-chrome';
import LandingNav from '../LandingNav';
import Navigation from '../Navigation';
import useHelpTopicManager from '../QuickStart/useHelpTopicManager';
import Footer from '../Footer/Footer';
import updateSharedScope from '../../chrome/update-shared-scope';
import useBundleVisitDetection from '../../hooks/useBundleVisitDetection';
import chromeApiWrapper from './chromeApiWrapper';
import { useFlag } from '@unleash/proxy-client-react';
import { ITLess } from '../../utils/common';

const ProductSelection = lazy(() => import('../Stratosphere/ProductSelection'));

const useGlobalFilter = (callback: (selectedTags?: FlagTagsFilter) => any) => {
  const selectedTags = useSelector(({ globalFilter: { selectedTags } }: ReduxState) => selectedTags, shallowEqual);
  return callback(selectedTags);
};

export type ScalprumRootProps = {
  config: AppsConfig;
  helpTopicsAPI: HelpTopicsAPI;
  quickstartsAPI: QuickstartsApi;
};

const ScalprumRoot = memo(
  ({ config, helpTopicsAPI, quickstartsAPI, ...props }: ScalprumRootProps) => {
    const { setFilteredHelpTopics } = useContext(HelpTopicContext);
    const [cookieElement, setCookieElement] = useState<HTMLAnchorElement | null>(null);
    const internalFilteredTopics = useRef<HelpTopic[]>([]);
    const { analytics } = useContext(SegmentContext);

    const libJwt = useContext(LibtJWTContext);
    const store = useStore<ReduxState>();
    const modulesConfig = useSelector(({ chrome: { modules } }: ReduxState) => modules);

    const { setActiveTopic } = useHelpTopicManager(helpTopicsAPI);
    const navDropdownEnabled = useFlag('platform.chrome.navigation-dropdown');

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
      const unregister = chromeHistory.listen(historyListener);
      return () => {
        if (typeof unregister === 'function') {
          return unregister();
        }
      };
    }, []);

    const setPageMetadata = useCallback((pageOptions) => {
      window._segment = {
        ...window._segment,
        pageOptions,
      };
    }, []);

    const getUser = useCallback(createGetUser(libJwt), [libJwt]);
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
    const chromeApi = useMemo(
      () =>
        createChromeContext({
          analytics: analytics!,
          getUser,
          helpTopics: helpTopicsChromeApi,
          libJwt,
          modulesConfig,
          quickstartsAPI,
          useGlobalFilter,
          store,
          setPageMetadata,
        }),
      []
    );

    const scalprumProviderProps: ScalprumProviderProps<{ chrome: ChromeAPI }> = useMemo(() => {
      // set the deprecated chrome API to window
      window.insights.chrome = chromeApiWrapper(chromeApi);
      return {
        config,
        api: {
          chrome: chromeApi,
        },
        pluginSDKOptions: {
          pluginLoaderOptions: {
            // sharedScope: scope,
            postProcessManifest: (manifest) => {
              if (manifest.name === 'chrome') {
                return {
                  ...manifest,
                  // Do not include chrome chunks in manifest for chrome. It will result in an infinite loading loop
                  // window.chrome always exists because chrome container is always initialized
                  loadScripts: [],
                };
              }
              return {
                ...manifest,
                // Compatibility required for bot pure SDK plugins, HCC plugins and sdk v1/v2 plugins until all are on the same system.
                baseURL: '/',
                loadScripts: manifest.loadScripts?.map((script) => `${manifest.baseURL}${script}`.replace(/\/\//, '/')) ?? [
                  `${manifest.baseURL ?? ''}plugin-entry.js`,
                ],
                registrationMethod: manifest.registrationMethod ?? 'callback',
              };
            },
          },
        },
      };
    }, []);

    return (
      /**
       * Once all applications are migrated to chrome 2:
       * - define chrome API in chrome root after it mounts
       * - copy these functions to window
       * - add deprecation warning to the window functions
       */
      <ScalprumProvider {...scalprumProviderProps}>
        <Routes>
          <Route
            index
            path="/"
            element={
              <DefaultLayout
                Sidebar={navDropdownEnabled ? undefined : LandingNav}
                Footer={<Footer setCookieElement={setCookieElement} cookieElement={cookieElement} />}
                {...props}
              />
            }
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
      </ScalprumProvider>
    );
  },
  // config rarely changes
  (prev, next) => isEqual(prev.config, next.config)
);

ScalprumRoot.displayName = 'MemoizedScalprumRoot';

export default ScalprumRoot;

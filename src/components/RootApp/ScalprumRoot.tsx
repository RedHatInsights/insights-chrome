import React, { Component, Fragment, ReactNode, Suspense, memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { PluginManifest, RemotePluginManifest } from '@openshift/dynamic-plugin-sdk';
import { ScalprumComponent, ScalprumProvider, ScalprumProviderConfigurableProps } from '@scalprum/react-core';
import { Route, Routes } from 'react-router-dom';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { ChromeProvider } from '@redhat-cloud-services/chrome';
import { useAtomValue, useSetAtom } from 'jotai';
import chromeHistory from '../../utils/chromeHistory';
import DefaultLayout from '../../layouts/DefaultLayout';
import AllServices from '../../layouts/AllServices';
import FavoritedServices from '../../layouts/FavoritedServices';
import historyListener from '../../utils/historyListener';
import SegmentContext from '../../analytics/SegmentContext';
import LoadingFallback from '../../utils/loading-fallback';
import { FlagTagsFilter } from '../../@types/types';
import { createChromeContext } from '../../chrome/create-chrome';
import Navigation from '../Navigation';
import ChromeFooter from '../Footer/Footer';
import updateSharedScope from '../../chrome/update-shared-scope';
import useBundleVisitDetection from '../../hooks/useBundleVisitDetection';
import chromeApiWrapper from './chromeApiWrapper';
import { ITLess, LIGHTWELL_PATH } from '../../utils/common';
import { lazyWithRetry } from '../../utils/chunkLoadErrorUtils';
import InternalChromeContext from '../../utils/internalChromeContext';
import useChromeServiceEvents from '../../hooks/useChromeServiceEvents';
import useTrackPendoUsage from '../../hooks/useTrackPendoUsage';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { onRegisterModuleWriteAtom } from '../../state/atoms/chromeModuleAtom';
import useTabName from '../../hooks/useTabName';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { addNavListenerAtom, deleteNavListenerAtom } from '../../state/atoms/activeAppAtom';
import BetaSwitcher from '../BetaSwitcher';
import DegradedStateBanner from '../DegradedStateBanner';
import useHandlePendoScopeUpdate from '../../hooks/useHandlePendoScopeUpdate';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { ScalprumConfig } from '../../state/atoms/scalprumConfigAtom';
import transformScalprumManifest from './transformScalprumManifest';
import { segmentPageOptionsAtom } from '../../state/atoms/segmentPageOptionsAtom';
import useDPAL from '../../analytics/useDpal';
import { selectedTagsAtom } from '../../state/atoms/globalFilterAtom';
import useAmplitude from '../../analytics/useAmplitude';
import usePf5Styles from '../../hooks/usePf5Styles';
import { liveQuickstartsAPIRef, liveHelpTopicsAPIRef, remoteActiveQuickStartIDAtom } from '../../state/atoms/remoteQuickstartsAtom';

const ProductSelection = lazyWithRetry(() => import('../Stratosphere/ProductSelection'));
const Lightwell = lazyWithRetry(() => import('../../layouts/Lightwell'));

const isRemotePluginManifest = (manifest: PluginManifest): manifest is RemotePluginManifest => manifest.registrationMethod !== 'local';

const useGlobalFilter = (callback: (selectedTags?: FlagTagsFilter) => any) => {
  const selectedTags = useAtomValue(selectedTagsAtom);

  useEffect(() => {
    callback(selectedTags);
  }, [selectedTags, callback]);

  return callback(selectedTags);
};

class QuickstartsRuntimeBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('Quickstarts runtime failed:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const PassThrough = ({ children }: { children?: ReactNode; error?: unknown }) => <>{children}</>;

const QuickstartsRuntimeMount = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(ChromeAuthContext);
  const activeModule = useAtomValue(activeModuleAtom);
  const setRemoteActiveQSID = useSetAtom(remoteActiveQuickStartIDAtom);

  const handleApiReady = useCallback(
    (api: { quickstartsAPI: ChromeAPI['quickStarts']; helpTopicsAPI: ChromeAPI['helpTopics'] }) => {
      liveQuickstartsAPIRef.current = api.quickstartsAPI;
      liveHelpTopicsAPIRef.current = api.helpTopicsAPI;
    },
    []
  );

  const handleActiveQSChanged = useCallback(
    (id: string) => {
      setRemoteActiveQSID(id);
    },
    [setRemoteActiveQSID]
  );

  return (
    <QuickstartsRuntimeBoundary fallback={children}>
      <ScalprumComponent
        scope="learningResources"
        module="./QuickstartsRuntime"
        ErrorComponent={<PassThrough>{children}</PassThrough>}
        fallback={children}
        accountId={user?.identity?.internal?.account_id}
        activeModule={activeModule}
        onApiReady={handleApiReady}
        onActiveQuickStartChanged={handleActiveQSChanged}
      >
        {children}
      </ScalprumComponent>
    </QuickstartsRuntimeBoundary>
  );
};

const ScalprumRoot = memo(
  () => {
    return (
      <ChromeProvider>
        <BetaSwitcher />
        <DegradedStateBanner />
        <QuickstartsRuntimeMount>
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
          <Route
            path={`${LIGHTWELL_PATH}/*`}
            element={
              <Suspense fallback={LoadingFallback}>
                <Lightwell />
              </Suspense>
            }
          />
          <Route path="*" element={<DefaultLayout Sidebar={Navigation} />} />
        </Routes>
        </QuickstartsRuntimeMount>
      </ChromeProvider>
    );
    // no props, no need to ever render based on parent changes
  },
  () => true
);

ScalprumRoot.displayName = 'MemoizedScalprumRoot';

export type ChromeApiRootProps = {
  config: ScalprumConfig;
};

const delegatedQuickstartsAPI = {
  version: 1,
  set: (...args: Parameters<ChromeAPI['quickStarts']['set']>) => liveQuickstartsAPIRef.current?.set(...args),
  activateQuickstart: (name: string) => liveQuickstartsAPIRef.current?.activateQuickstart(name) ?? Promise.resolve(),
  toggle: (...args: Parameters<ChromeAPI['quickStarts']['toggle']>) => liveQuickstartsAPIRef.current?.toggle(...args),
  Catalog: ((props: Record<string, unknown>) => {
    const Catalog = liveQuickstartsAPIRef.current?.Catalog;
    return Catalog ? <Catalog {...props} /> : null;
  }) as ChromeAPI['quickStarts']['Catalog'],
  updateQuickStarts: (key: string, quickstarts: unknown[]) =>
    (liveQuickstartsAPIRef.current as any)?.updateQuickStarts(key, quickstarts),
  add: (key: string, qs: unknown) =>
    (liveQuickstartsAPIRef.current as any)?.add?.(key, qs) ?? false,
} as ChromeAPI['quickStarts'];

const delegatedHelpTopicsAPI: ChromeAPI['helpTopics'] = {
  addHelpTopics: (...args) => liveHelpTopicsAPIRef.current?.addHelpTopics(...args),
  disableTopics: (...args) => liveHelpTopicsAPIRef.current?.disableTopics(...args),
  enableTopics: (...args: any[]) => liveHelpTopicsAPIRef.current?.enableTopics(...args) ?? Promise.resolve([]),
  setActiveTopic: (...args) => liveHelpTopicsAPIRef.current?.setActiveTopic(...args) ?? Promise.resolve(),
  closeHelpTopic: () => liveHelpTopicsAPIRef.current?.closeHelpTopic(),
};

const ChromeApiRoot = ({ config }: ChromeApiRootProps) => {
  const chromeAuth = useContext(ChromeAuthContext);
  const mutableChromeApi = useRef<ChromeAPI>(undefined);
  const isPreview = useAtomValue(isPreviewAtom);
  const addNavListener = useSetAtom(addNavListenerAtom);
  const deleteNavListener = useSetAtom(deleteNavListenerAtom);
  const { analytics } = useContext(SegmentContext);
  const registerModule = useSetAtom(onRegisterModuleWriteAtom);
  const activeModule = useAtomValue(activeModuleAtom);
  const setPageOptions = useSetAtom(segmentPageOptionsAtom);

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
  // initialize adobe analytics
  useDPAL();
  // initialize amplitude analytics
  useAmplitude();

  // apply pf5 styles if the flag is enabled
  usePf5Styles();

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
    setPageOptions(pageOptions);
  }, []);

  useMemo(() => {
    mutableChromeApi.current = createChromeContext({
      analytics: analytics!,
      helpTopics: delegatedHelpTopicsAPI,
      quickstartsAPI: delegatedQuickstartsAPI,
      useGlobalFilter,
      setPageMetadata,
      chromeAuth,
      registerModule,
      isPreview,
      addNavListener,
      deleteNavListener,
      addWsEventListener,
    });
  }, [isPreview, chromeAuth.token, chromeAuth.refreshToken]);

  if (!mutableChromeApi.current) {
    return null;
  }

  const scalprumProviderProps: ScalprumProviderConfigurableProps<{ chrome: ChromeAPI }> = useMemo(() => {
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
          transformPluginManifest: (manifest) =>
            isRemotePluginManifest(manifest) ? (transformScalprumManifest(manifest, config) as typeof manifest) : manifest,
        },
      },
    };
  }, [isPreview, chromeAuth.token, chromeAuth.refreshToken]);

  return (
    <InternalChromeContext.Provider value={mutableChromeApi.current}>
      <ScalprumProvider {...scalprumProviderProps}>
        <ScalprumRoot />
      </ScalprumProvider>
    </InternalChromeContext.Provider>
  );
};

export default ChromeApiRoot;

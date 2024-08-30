import { useSetAtom } from 'jotai';
import React, { Suspense, useContext, useEffect, useState } from 'react';
import RootApp from './components/RootApp';
import { ChromeUserConfig, initChromeUserConfig } from './utils/initUserConfig';
import useSuspenseLoader from '@redhat-cloud-services/frontend-components-utilities/useSuspenseLoader/useSuspenseLoader';
import AppPlaceholder from './components/AppPlaceholder';
import ChromeAuthContext from './auth/ChromeAuthContext';
import registerAnalyticsObserver from './analytics/analyticsObserver';
import { ITLess, trustarcScriptSetup } from './utils/common';
import { isPreviewAtom } from './state/atoms/releaseAtom';

const isITLessEnv = ITLess();

const useInitializeAnalytics = () => {
  useEffect(() => {
    // setup trust arc
    trustarcScriptSetup();
    // setup adobe analytics
    if (!isITLessEnv && typeof window._satellite !== 'undefined' && typeof window._satellite.pageBottom === 'function') {
      window._satellite.pageBottom();
      registerAnalyticsObserver();
    }
  }, []);
};

const App = ({ initApp }: { initApp: (...args: Parameters<typeof initChromeUserConfig>) => ChromeUserConfig | undefined }) => {
  const { getUser, token } = useContext(ChromeAuthContext);
  // triggers suspense based async call to block rendering until the async call is resolved
  // TODO: Most of async init should be moved to this method
  initApp({
    getUser,
    token,
  });
  const [cookieElement, setCookieElement] = useState<HTMLAnchorElement | null>(null);

  useInitializeAnalytics();

  return <RootApp cookieElement={cookieElement} setCookieElement={setCookieElement} />;
};

export const ConfigLoader = () => {
  const initPreview = useSetAtom(isPreviewAtom);
  function initSuccess(userConfig: ChromeUserConfig) {
    initPreview(userConfig.data.uiPreview);
  }
  function initFail() {
    initPreview(false);
  }
  const { loader } = useSuspenseLoader(initChromeUserConfig, initSuccess, initFail);
  const [cookieElement, setCookieElement] = useState<HTMLAnchorElement | null>(null);
  return (
    <Suspense fallback={<AppPlaceholder cookieElement={cookieElement} setCookieElement={setCookieElement} />}>
      <App initApp={loader} />
    </Suspense>
  );
};

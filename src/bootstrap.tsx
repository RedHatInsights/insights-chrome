import React, { Suspense, useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { Provider as JotaiProvider, useSetAtom } from 'jotai';

import { spinUpStore } from './redux/redux-config';
import RootApp from './components/RootApp';
import registerAnalyticsObserver from './analytics/analyticsObserver';
import { ITLess, getEnv, trustarcScriptSetup } from './utils/common';
import OIDCProvider from './auth/OIDCConnector/OIDCProvider';
import messages from './locales/data.json';
import ErrorBoundary from './components/ErrorComponents/ErrorBoundary';
import chromeStore from './state/chromeStore';
import { GenerateId } from '@patternfly/react-core/dist/dynamic/helpers/GenerateId/GenerateId';
import { isPreviewAtom } from './state/atoms/releaseAtom';
import AppPlaceholder from './components/AppPlaceholder';
import { ChromeUserConfig, initChromeUserConfig } from './utils/initUserConfig';
import ChromeAuthContext from './auth/ChromeAuthContext';
import useSuspenseLoader from '@redhat-cloud-services/frontend-components-utilities/useSuspenseLoader/useSuspenseLoader';

const isITLessEnv = ITLess();
const language: keyof typeof messages = 'en';
const AuthProvider = OIDCProvider;

GenerateId.defaultProps.prefix = 'hc-console-';
GenerateId.defaultProps.isRandom = true;

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

const ConfigLoader = () => {
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

const entry = document.getElementById('chrome-entry');
if (entry) {
  const reactRoot = createRoot(entry);
  reactRoot.render(
    <JotaiProvider store={chromeStore}>
      <Provider store={spinUpStore()?.store}>
        <IntlProvider
          locale={language}
          messages={messages[language]}
          onError={(error) => {
            if (
              (getEnv() === 'stage' && !window.location.origin.includes('foo')) ||
              localStorage.getItem('chrome:intl:debug') === 'true' ||
              !(error.code === ReactIntlErrorCode.MISSING_TRANSLATION)
            ) {
              console.error(error);
            }
          }}
        >
          <ErrorBoundary>
            <AuthProvider>
              <ConfigLoader />
            </AuthProvider>
          </ErrorBoundary>
        </IntlProvider>
      </Provider>
    </JotaiProvider>
  );
}

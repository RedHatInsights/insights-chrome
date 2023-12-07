import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { Provider as JotaiProvider } from 'jotai';

import { spinUpStore } from './redux/redux-config';
import RootApp from './components/RootApp';
import registerAnalyticsObserver from './analytics/analyticsObserver';
import { ITLess, getEnv, trustarcScriptSetup } from './utils/common';
import { ReduxState } from './redux/store';
import OIDCProvider from './auth/OIDCConnector/OIDCProvider';
import messages from './locales/data.json';
import ErrorBoundary from './components/ErrorComponents/ErrorBoundary';
import chromeStore from './state/chromeStore';

const isITLessEnv = ITLess();
const language: keyof typeof messages = 'en';
const AuthProvider = OIDCProvider;

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

const App = () => {
  const documentTitle = useSelector(({ chrome }: ReduxState) => chrome?.documentTitle);
  const [cookieElement, setCookieElement] = useState<HTMLAnchorElement | null>(null);

  useInitializeAnalytics();

  useEffect(() => {
    const title = typeof documentTitle === 'string' ? `${documentTitle} | ` : '';
    document.title = `${title}console.redhat.com`;
  }, [documentTitle]);

  return <RootApp cookieElement={cookieElement} setCookieElement={setCookieElement} />;
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
              <App />
            </AuthProvider>
          </ErrorBoundary>
        </IntlProvider>
      </Provider>
    </JotaiProvider>
  );
}

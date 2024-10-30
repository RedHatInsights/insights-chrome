import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { Provider as JotaiProvider } from 'jotai';

import { spinUpStore } from './redux/redux-config';
import RootApp from './components/RootApp';
import registerAnalyticsObserver from './analytics/analyticsObserver';
import { ITLess, getEnv, trustarcScriptSetup } from './utils/common';
import OIDCProvider from './auth/OIDCConnector/OIDCProvider';
import messages from './locales/data.json';
import ErrorBoundary from './components/ErrorComponents/ErrorBoundary';
import chromeStore from './state/chromeStore';
import { GenerateId } from '@patternfly/react-core/dist/dynamic/helpers/GenerateId/GenerateId';
import AppPlaceholder from './components/AppPlaceholder';
import useSessionConfig from './hooks/useSessionConfig';

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

const App = () => {
  const loaded = useSessionConfig();

  useInitializeAnalytics();

  if (!loaded) {
    return <AppPlaceholder />;
  }

  return <RootApp />;
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

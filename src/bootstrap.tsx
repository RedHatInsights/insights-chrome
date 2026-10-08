import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { Provider as JotaiProvider } from 'jotai';
import RootApp from './components/RootApp';
import { getEnv, trustarcScriptSetup } from './utils/common';
import OIDCProvider from './auth/OIDCConnector/OIDCProvider';
import { loadMessages } from './locales/loadMessages';
import ErrorBoundary from './components/ErrorComponents/ErrorBoundary';
import chromeStore from './state/chromeStore';
import AppPlaceholder from './components/AppPlaceholder';
import useSessionConfig from './hooks/useSessionConfig';
import GatewayErrorComponent from './components/ErrorComponents/GatewayErrorComponent';
import ConfigCacheDegradedStateBridge from './components/ConfigCacheDegradedStateBridge/ConfigCacheDegradedStateBridge';

const AuthProvider = OIDCProvider;

const useInitializeAnalytics = () => {
  useEffect(() => {
    // setup trust arc
    trustarcScriptSetup();
  }, []);
};

const App = () => {
  const { gatewayError, configLoaded } = useSessionConfig();

  useInitializeAnalytics();

  if (!configLoaded) {
    return gatewayError ? <GatewayErrorComponent error={gatewayError} serviceName="Hybrid Cloud Console" /> : <AppPlaceholder />;
  }

  return <RootApp />;
};

const entry = document.getElementById('chrome-entry');
if (entry) {
  const reactRoot = createRoot(entry);
  loadMessages(navigator.language || 'en')
    .then(({ locale, messages }) => {
      reactRoot.render(
        <JotaiProvider store={chromeStore}>
          <ConfigCacheDegradedStateBridge />
          <IntlProvider
            locale={locale}
            messages={messages}
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
        </JotaiProvider>
      );
    })
    .catch((error) => {
      console.error('Unable to load locale catalogs', error);
      throw error;
    });
}

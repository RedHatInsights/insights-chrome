import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { Provider as JotaiProvider } from 'jotai';
import RootApp from './components/RootApp';
import { getEnv, trustarcScriptSetup } from './utils/common';
import OIDCProvider from './auth/OIDCConnector/OIDCProvider';
import messages from './locales/data.json';
import ErrorBoundary from './components/ErrorComponents/ErrorBoundary';
import chromeStore from './state/chromeStore';
import { GenerateId } from '@patternfly/react-core/dist/dynamic/helpers/GenerateId/GenerateId';
import AppPlaceholder from './components/AppPlaceholder';
import useSessionConfig from './hooks/useSessionConfig';
import GatewayErrorComponent from './components/ErrorComponents/GatewayErrorComponent';

const language: keyof typeof messages = 'en';
const AuthProvider = OIDCProvider;

GenerateId.defaultProps.prefix = 'hc-console-';
GenerateId.defaultProps.isRandom = true;

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
  reactRoot.render(
    <JotaiProvider store={chromeStore}>
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
    </JotaiProvider>
  );
}

import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as JotaiProvider } from 'jotai';
import RootApp from './components/RootApp';
import { trustarcScriptSetup } from './utils/common';
import OIDCProvider from './auth/OIDCConnector/OIDCProvider';
import ErrorBoundary from './components/ErrorComponents/ErrorBoundary';
import chromeStore from './state/chromeStore';
import AppPlaceholder from './components/AppPlaceholder';
import useSessionConfig from './hooks/useSessionConfig';
import GatewayErrorComponent from './components/ErrorComponents/GatewayErrorComponent';
import ConfigCacheDegradedStateBridge from './components/ConfigCacheDegradedStateBridge/ConfigCacheDegradedStateBridge';
import ChromeIntlProvider from './components/ChromeIntlProvider/ChromeIntlProvider';

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
  reactRoot.render(
    <JotaiProvider store={chromeStore}>
      <ConfigCacheDegradedStateBridge />
      <ChromeIntlProvider>
        <ErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </ChromeIntlProvider>
    </JotaiProvider>
  );
}

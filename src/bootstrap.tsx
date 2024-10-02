import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { Provider as JotaiProvider } from 'jotai';

import { spinUpStore } from './redux/redux-config';
import { getEnv } from './utils/common';
import OIDCProvider from './auth/OIDCConnector/OIDCProvider';
import messages from './locales/data.json';
import ErrorBoundary from './components/ErrorComponents/ErrorBoundary';
import chromeStore from './state/chromeStore';
import { GenerateId } from '@patternfly/react-core/dist/dynamic/helpers/GenerateId/GenerateId';
import App from './components/App';

const language: keyof typeof messages = 'en';

GenerateId.defaultProps.prefix = 'hc-console-';
GenerateId.defaultProps.isRandom = true;

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
            <OIDCProvider>
              <App />
            </OIDCProvider>
          </ErrorBoundary>
        </IntlProvider>
      </Provider>
    </JotaiProvider>
  );
}

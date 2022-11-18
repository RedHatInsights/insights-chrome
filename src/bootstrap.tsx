import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Provider, useDispatch, useSelector, useStore } from 'react-redux';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { spinUpStore } from './redux/redux-config';
import RootApp from './components/RootApp';
import { loadModulesSchema } from './redux/actions';
import Cookies from 'js-cookie';
import { ACTIVE_REMOTE_REQUEST, CROSS_ACCESS_ACCOUNT_NUMBER } from './utils/consts';
import auth, { LibJWT, crossAccountBouncer } from './auth';
import sentry from './utils/sentry';
import createChromeInstance from './chrome/create-chrome';
import registerAnalyticsObserver from './analytics/analyticsObserver';
import { getEnv, loadFedModules, noop, trustarcScriptSetup } from './utils/common';
import messages from './locales/data.json';
import ErrorBoundary from './components/ErrorComponents/ErrorBoundary';
import LibtJWTContext from './components/LibJWTContext';
import { ReduxState } from './redux/store';
import { ChromeAPI } from '@redhat-cloud-services/types';

const language: keyof typeof messages = 'en';

const initializeAccessRequestCookies = () => {
  const initialAccount = localStorage.getItem(ACTIVE_REMOTE_REQUEST);
  if (Cookies.get(CROSS_ACCESS_ACCOUNT_NUMBER) && initialAccount) {
    try {
      const { end_date } = JSON.parse(initialAccount);
      /**
       * Remove cross account request if it is expired
       */
      if (new Date(end_date).getTime() <= Date.now()) {
        crossAccountBouncer();
      }
    } catch {
      console.log('Unable to parse initial account. Using default account');
      Cookies.remove(CROSS_ACCESS_ACCOUNT_NUMBER);
    }
  }
};

const libjwtSetup = (chromeConfig: { ssoUrl?: string }, setReadyState: (isReady: boolean) => void) => {
  const libjwt = auth(chromeConfig || {});

  libjwt.initPromise.then(() => {
    return libjwt.jwt
      .getUserInfo()
      .then((chromeUser) => {
        if (chromeUser) {
          sentry(chromeUser);
        }
        setReadyState(true);
      })
      .catch(noop);
  });

  return libjwt;
};

const App = () => {
  const modules = useSelector(({ chrome }: ReduxState) => chrome?.modules);
  const scalprumConfig = useSelector(({ chrome }: ReduxState) => chrome?.scalprumConfig);
  const documentTitle = useSelector(({ chrome }: ReduxState) => chrome?.documentTitle);
  const dispatch = useDispatch();
  const [jwtState, setJwtState] = useState(false);
  const [libjwt, setLibjwt] = useState<LibJWT>();
  const store = useStore();

  useEffect(() => {
    loadFedModules().then(({ data }) => {
      const { chrome: chromeConfig } = data;
      dispatch(loadModulesSchema(data));
      initializeAccessRequestCookies();
      const libjwt = libjwtSetup(chromeConfig?.config || chromeConfig, setJwtState);
      // TODO: Create subset for window. Window CHROME API does not have all the functions ass the Context value
      window.insights = createChromeInstance(libjwt, window.insights, data, store) as unknown as { chrome: ChromeAPI };
      setLibjwt(libjwt);
    });
    if (typeof window._satellite !== 'undefined' && typeof window._satellite.pageBottom === 'function') {
      window._satellite.pageBottom();
      registerAnalyticsObserver();
    }

    trustarcScriptSetup();
  }, []);

  useEffect(() => {
    const title = typeof documentTitle === 'string' ? `${documentTitle} | ` : '';
    document.title = `${title}console.redhat.com`;
  }, [documentTitle]);

  return modules && scalprumConfig && jwtState && libjwt ? (
    <LibtJWTContext.Provider value={libjwt}>
      <RootApp config={scalprumConfig} />
    </LibtJWTContext.Provider>
  ) : null;
};

ReactDOM.render(
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
    <Provider store={spinUpStore()?.store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>
  </IntlProvider>,
  document.getElementById('chrome-entry')
);

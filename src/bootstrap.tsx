import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Provider, useSelector, useStore } from 'react-redux';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { spinUpStore } from './redux/redux-config';
import RootApp from './components/RootApp';
import { loadModulesSchema } from './redux/actions';
import Cookies from 'js-cookie';
import { ACTIVE_REMOTE_REQUEST, CROSS_ACCESS_ACCOUNT_NUMBER } from './utils/consts';
import auth, { LibJWT, crossAccountBouncer } from './auth';
import sentry from './utils/sentry';
import registerAnalyticsObserver from './analytics/analyticsObserver';
import { ITLess, getEnv, loadFedModules, noop, trustarcScriptSetup } from './utils/common';
import messages from './locales/data.json';
import ErrorBoundary from './components/ErrorComponents/ErrorBoundary';
import LibtJWTContext from './components/LibJWTContext';
import { ReduxState } from './redux/store';
import qe from './utils/iqeEnablement';
import initializeJWT from './jwt/initialize-jwt';
import AppPlaceholder from './components/AppPlaceholder';

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

const libjwtSetup = (chromeConfig: { ssoUrl?: string }) => {
  const libjwt = auth(chromeConfig || {});

  libjwt.initPromise.then(() => {
    return libjwt.jwt
      .getUserInfo()
      .then((chromeUser) => {
        if (chromeUser) {
          sentry(chromeUser);
        }
      })
      .catch(noop);
  });

  return libjwt;
};

const isITLessEnv = ITLess();

const useInitialize = () => {
  const [{ isReady, libJwt }, setState] = useState<{ isReady: boolean; libJwt?: LibJWT }>({ isReady: false, libJwt: undefined });
  const store = useStore();
  const chromeInstance = useRef({ cache: undefined });
  useEffect(() => {
    // We have to use `let` because we want to access it once jwt is initialized
    let libJwt: LibJWT | undefined = undefined;
    // init qe functions, callback for libjwt because we want it to initialize before jwt is ready
    qe.init(store, () => libJwt);
    // initi fed modules registry
    loadFedModules().then(({ data }) => {
      const { chrome: chromeConfig } = data;
      store.dispatch(loadModulesSchema(data));
      initializeAccessRequestCookies();
      // create JWT instance
      libJwt = libjwtSetup({ ...chromeConfig?.config, ...chromeConfig });
      // initialize JWT instance
      initializeJWT(libJwt, chromeInstance.current).then(() => {
        setState({
          libJwt,
          isReady: true,
        });
      });
    });
    // setup trust arc
    trustarcScriptSetup();
    // setup adobe analytics
    if (!isITLessEnv && typeof window._satellite !== 'undefined' && typeof window._satellite.pageBottom === 'function') {
      window._satellite.pageBottom();
      registerAnalyticsObserver();
    }
  }, []);

  return {
    isReady,
    libJwt,
  };
};

const App = () => {
  const modules = useSelector(({ chrome }: ReduxState) => chrome?.modules);
  const scalprumConfig = useSelector(({ chrome }: ReduxState) => chrome?.scalprumConfig);
  const documentTitle = useSelector(({ chrome }: ReduxState) => chrome?.documentTitle);
  const { isReady, libJwt } = useInitialize();

  useEffect(() => {
    const title = typeof documentTitle === 'string' ? `${documentTitle} | ` : '';
    document.title = `${title}console.redhat.com`;
  }, [documentTitle]);

  if (isITLessEnv) {
    return isReady && modules && scalprumConfig ? <RootApp config={scalprumConfig} /> : <AppPlaceholder />;
  }

  return isReady && modules && scalprumConfig && libJwt ? (
    <LibtJWTContext.Provider value={libJwt}>
      <RootApp config={scalprumConfig} />
    </LibtJWTContext.Provider>
  ) : (
    <AppPlaceholder />
  );
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

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, useSelector, useStore } from 'react-redux';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { matchRoutes } from 'react-router-dom';

import { spinUpStore } from './redux/redux-config';
import RootApp from './components/RootApp';
import { loadModulesSchema } from './redux/actions';
import Cookies from 'js-cookie';
import { ACTIVE_REMOTE_REQUEST, CROSS_ACCESS_ACCOUNT_NUMBER } from './utils/consts';
import auth, { LibJWT, createGetUserPermissions, crossAccountBouncer } from './auth';
import sentry from './utils/sentry';
import registerAnalyticsObserver from './analytics/analyticsObserver';
import { ITLess, generateRoutesList, getEnv, loadFedModules, noop, trustarcScriptSetup } from './utils/common';
import messages from './locales/data.json';
import ErrorBoundary from './components/ErrorComponents/ErrorBoundary';
import LibtJWTContext from './components/LibJWTContext';
import { ReduxState } from './redux/store';
import qe from './utils/iqeEnablement';
import initializeJWT from './jwt/initialize-jwt';
import AppPlaceholder from './components/AppPlaceholder';
import { initializeVisibilityFunctions } from './utils/VisibilitySingleton';
import { createGetUser } from './auth';

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

const libjwtSetup = (chromeConfig: { ssoUrl?: string }, ssoScopes: string[] = []) => {
  const libjwt = auth({ ...chromeConfig, ssoScopes } || { ssoScopes });

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

  const init = async () => {
    const pathname = window.location.pathname;
    // We have to use `let` because we want to access it once jwt is initialized
    let libJwt: LibJWT | undefined = undefined;
    // init qe functions, callback for libjwt because we want it to initialize before jwt is ready
    qe.init(store, () => libJwt);

    // Load federated modules before the SSO init phase to obtain scope configuration
    const { data: modulesData } = await loadFedModules();
    const { chrome: chromeConfig } = modulesData;
    const routes = generateRoutesList(modulesData);
    store.dispatch(loadModulesSchema(modulesData));
    // ge the initial module UI identifier
    const initialModuleScope = matchRoutes(
      routes.map(({ path, ...rest }) => ({
        ...rest,
        path: `${path}/*`,
      })),
      // modules config does not include the preview fragment
      pathname.replace(/^\/(preview|beta)/, '')
    )?.[0]?.route?.scope;
    const initialModuleConfig = initialModuleScope && modulesData[initialModuleScope]?.config;
    initializeAccessRequestCookies();
    // create JWT instance
    libJwt = libjwtSetup({ ...chromeConfig?.config, ...chromeConfig }, initialModuleConfig?.ssoScopes);

    await initializeJWT(libJwt);
    const getUser = createGetUser(libJwt);
    initializeVisibilityFunctions({
      getUser,
      getToken: () => libJwt!.initPromise.then(() => libJwt!.jwt.getUserInfo().then(() => libJwt!.jwt.getEncodedToken())),
      getUserPermissions: createGetUserPermissions(libJwt, getUser),
    });

    setState({
      libJwt,
      isReady: true,
    });
  };

  useEffect(() => {
    init();
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
  const [cookieElement, setCookieElement] = useState<HTMLAnchorElement | null>(null);
  const { isReady, libJwt } = useInitialize();

  useEffect(() => {
    const title = typeof documentTitle === 'string' ? `${documentTitle} | ` : '';
    document.title = `${title}console.redhat.com`;
  }, [documentTitle]);

  if (isITLessEnv) {
    return isReady && modules && scalprumConfig ? (
      <RootApp cookieElement={cookieElement} setCookieElement={setCookieElement} config={scalprumConfig} />
    ) : (
      <AppPlaceholder cookieElement={cookieElement} setCookieElement={setCookieElement} />
    );
  }

  return isReady && modules && scalprumConfig && libJwt ? (
    <LibtJWTContext.Provider value={libJwt}>
      <RootApp cookieElement={cookieElement} setCookieElement={setCookieElement} config={scalprumConfig} />
    </LibtJWTContext.Provider>
  ) : (
    <AppPlaceholder cookieElement={cookieElement} setCookieElement={setCookieElement} />
  );
};

const entry = document.getElementById('chrome-entry');
if (entry) {
  const reactRoot = createRoot(entry);
  reactRoot.render(
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
    </IntlProvider>
  );
}

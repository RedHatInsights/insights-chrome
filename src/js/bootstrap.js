import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { spinUpStore } from './redux-config';
import RootApp from './App/RootApp';
import { loadModulesSchema } from './redux/actions';
import Cookies from 'js-cookie';
import { ACTIVE_REMOTE_REQUEST, CROSS_ACCESS_ACCOUNT_NUMBER } from './consts';
import auth, { crossAccountBouncer } from './auth';
import sentry from './sentry';
import createChromeInstance from './chrome/create-chrome';
import registerUrlObserver from './url-observer';
import { loadFedModules, noop, trustarcScriptSetup } from './utils.ts';

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

const libjwtSetup = () => {
  const libjwt = auth();

  libjwt.initPromise.then(() => {
    libjwt.jwt
      .getUserInfo()
      .then((...data) => {
        sentry(...data);
      })
      .catch(noop);
  });

  return libjwt;
};

trustarcScriptSetup();

const App = () => {
  const modules = useSelector(({ chrome }) => chrome?.modules);
  const scalprumConfig = useSelector(({ chrome }) => chrome?.scalprumConfig);
  const documentTitle = useSelector(({ chrome }) => chrome?.documentTitle);
  const dispatch = useDispatch();
  const [jwtState, setJwtState] = useState(false);

  useEffect(() => {
    initializeAccessRequestCookies();
    const libjwt = libjwtSetup();
    libjwt.initPromise.then(() => setJwtState(true));

    window.insights = createChromeInstance(libjwt, window.insights);

    if (typeof _satellite !== 'undefined' && typeof window._satellite.pageBottom === 'function') {
      window._satellite.pageBottom();
      registerUrlObserver(window._satellite.pageBottom);
    }

    trustarcScriptSetup();

    loadFedModules().then((response) => {
      dispatch(loadModulesSchema(response.data));
    });
  }, []);

  useEffect(() => {
    const title = typeof documentTitle === 'string' ? `${documentTitle} | ` : '';
    document.title = `${title}console.redhat.com`;
  }, [documentTitle]);

  return modules && scalprumConfig && jwtState ? <RootApp config={scalprumConfig} /> : null;
};

ReactDOM.render(
  <Provider store={spinUpStore()?.store}>
    <App />
  </Provider>,
  document.getElementById('chrome-entry')
);

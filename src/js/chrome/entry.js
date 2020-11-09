import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { globalFilterScope, toggleGlobalFilter } from '../redux/actions';
import { spinUpStore } from '../redux-config';
import loadInventory from '../inventory/index';
import loadRemediations from '../remediations';
import qe from './iqeEnablement';
import consts from '../consts';
import RootApp from '../App/RootApp';
import { visibilityFunctions } from '../consts';
import Cookies from 'js-cookie';
import { getUrl } from '../utils';
import { createSupportCase } from '../createCase';
import get from 'lodash/get';
import sourceOfTruth from '../nav/sourceOfTruth';
import { flatTags } from '../App/GlobalFilter/constants';
import { safeLoad } from 'js-yaml';

export function chromeInit() {
  const { store, actions } = spinUpStore();

  // public API actions
  const { appAction, appObjectId } = actions;

  return {
    identifyApp: () => {},
    navigation: () => console.error("Don't use insights.chrome.navigation, it has been deprecated!"),
    appAction,
    appObjectId,
    hideGlobalFilter: (isHidden) => store.dispatch(toggleGlobalFilter(isHidden)),
    globalFilterScope: (scope) => store.dispatch(globalFilterScope(scope)),
    mapGlobalFilter: flatTags,
    appNavClick: () => {},
    on: () => {},
  };
}

export function bootstrap(libjwt, initFunc, getUser) {
  return {
    chrome: {
      auth: {
        getOfflineToken: () => libjwt.getOfflineToken(),
        doOffline: () => libjwt.jwt.doOffline(consts.noAuthParam, consts.offlineToken),
        getToken: () => libjwt.jwt.getUserInfo().then(() => libjwt.jwt.getEncodedToken()),
        getUser,
        qe: qe,
        logout: (bounce) => libjwt.jwt.logoutAllTabs(bounce),
        login: () => libjwt.jwt.login(),
      },
      isProd: window.location.host === 'cloud.redhat.com',
      isBeta: () => (window.location.pathname.split('/')[1] === 'beta' ? true : false),
      isPenTest: () => (Cookies.get('x-rh-insights-pentest') ? true : false),
      getBundle: () => getUrl('bundle'),
      getApp: () => getUrl('app'),
      createCase: (fields) => insights.chrome.auth.getUser().then((user) => createSupportCase(user.identity, fields)),
      visibilityFunctions,
      init: initFunc,
    },
    loadInventory,
    experimental: {
      loadRemediations,
    },
  };
}

const App = () => {
  const [config, setConfig] = useState();
  useEffect(() => {
    sourceOfTruth('testPrefix')
      .then((configYaml) => {
        let appConfig = safeLoad(configYaml);
        Object.entries(appConfig).forEach(([key, val]) => {
          val['scriptLocation'] = `${window.location.origin}/apps/${key}/js/${key}.js`;
        });
        console.log('Config is done:');
        console.log(appConfig);
        return appConfig;
      })
      .then((appConfig) => {
        console.log('Setting config:');
        console.log(appConfig);
        setConfig(() => appConfig);
      })
      .catch(() => {
        /**
         * Fallback for testing and debugging don't delet this plis
         */
        const config = {
          advisor: {
            appId: 'advisor',
            elementId: 'advisor-root',
            name: 'advisor',
            rootLocation: '/foo',
            scriptLocation: `${window.location.origin}/apps/advisor/js/advisor.js`,
          },
          catalog: {
            appId: 'catalog',
            elementId: 'catalog-root',
            name: 'catalog',
            rootLocation: '/bar',
            scriptLocation: `${window.location.origin}/apps/catalog/js/catalog.js`,
          },
        };
        setConfig(config);
      });
  }, []);

  return config ? <RootApp config={config} /> : <div>loading...</div>;
};

export function rootApp() {
  const { store } = spinUpStore();
  const pageRoot = document.querySelector('.pf-c-page__drawer');
  if (pageRoot) {
    ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      pageRoot
    );
  }
}

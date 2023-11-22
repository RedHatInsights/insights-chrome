import React, { useEffect, useState } from 'react';
import { cogLogout, createUser, getEntitlements, getTokenWithAuthorizationCode, getUser, login, mapCogUserToChromeUser } from './auth';
import ChromeAuthContext, { ChromeAuthContextValue } from '../ChromeAuthContext';
import { initializeVisibilityFunctions } from '../../utils/VisibilitySingleton';
import createGetUserPermissions from '../createGetUserPermissions';
import { loadModulesSchema } from '../../redux/actions';
import { useDispatch, useStore } from 'react-redux';
import initializeAccessRequestCookies from '../initializeAccessRequestCookies';
import { init } from '../../utils/iqeEnablement';
import logger from '../logger';
import AppPlaceholder from '../../components/AppPlaceholder';
import { loadFedModules } from '../../utils/common';
import { setCookie } from '../setCookie';

const authChannel = new BroadcastChannel('auth');
const log = logger('ITLessProvider.tsx');

const ITLessProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [cookieElement, setCookieElement] = useState<HTMLAnchorElement | null>(null);
  const [state, setState] = useState<ChromeAuthContextValue>({
    ready: false,
    logout: () => {
      cogLogout();
    },
    login: async () => {
      login('your_username', 'your_password');
    },
    logoutAllTabs: () => {
      authChannel.postMessage({ type: 'logout' });
      cogLogout();
    },
    loginAllTabs: () => {
      authChannel.postMessage({ type: 'login' });
    },
    getUser: createUser,
    getToken: getTokenWithAuthorizationCode,
    user: {
      entitlements: {},
      identity: {
        type: '',
        org_id: '',
      },
    },
    token: '',
    tokenExpires: 0,
    doOffline: () => Promise.resolve(),
    getOfflineToken: getTokenWithAuthorizationCode,
  });

  const store = useStore();
  const dispatch = useDispatch();

  async function setupSSO() {
    const { data: microFrontendConfig } = await loadFedModules();
    dispatch(loadModulesSchema(microFrontendConfig));
    initializeAccessRequestCookies();

    const user = await getUser();
    const entitlementRes = await getEntitlements();
    const token = await getTokenWithAuthorizationCode();
    const chromeUser = mapCogUserToChromeUser(user, entitlementRes);
    init(store, token);
    setCookie(token, user.exp);
    initializeVisibilityFunctions({
      getUser: createUser,
      getToken: getTokenWithAuthorizationCode,
      getUserPermissions: createGetUserPermissions(createUser, getTokenWithAuthorizationCode),
    });
    authChannel.onmessage = (e) => {
      if (e && e.data && e.data.type) {
        log(`BroadcastChannel, Received event : ${e.data.type}`);

        // TODO: handle scopes
        switch (e.data.type) {
          case 'logout':
            return cogLogout();
          case 'login':
            return () => undefined;
          case 'refresh': {
            getTokenWithAuthorizationCode().then((token) => {
              setState((prev) => ({
                ...prev,
                token,
              }));
            });
          }
        }
      }
    };
    setState((prev) => ({
      ...prev,
      user: chromeUser,
      ready: true,
      token,
      tokenExpires: user?.exp,
    }));
  }
  useEffect(() => {
    setupSSO();
  }, []);

  if (state.ready) {
    return <AppPlaceholder cookieElement={cookieElement} setCookieElement={setCookieElement} />;
  }
  return <ChromeAuthContext.Provider value={state}>{children}</ChromeAuthContext.Provider>;
};

export default ITLessProvider;

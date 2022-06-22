import cookie from 'js-cookie';
import { data as encodedToken } from '../../../../testdata/encodedToken.json';

/* eslint-disable camelcase */
const Keycloak = (options: any) => {
  const scope = options.scope || 'online';
  const token = encodedToken;
  const tokenParsed = options.tokenParsed;
  const refreshToken = encodedToken;
  let redirectUri = options.redirectUri;
  return {
    callback_id: 0,
    authenticated: false,
    useNativePromise: true,
    responseMode: 'fragment',
    responseType: 'code',
    flow: 'standard',
    clientId: 'cloud-services',
    authServerUrl: 'https://sso.qa.redhat.com/auth',
    realm: 'redhat-external',
    endpoints: {},
    redirectUri,
    token,
    tokenParsed,
    refreshToken,
    scope,
    init: (options: any) => {
      return Promise.resolve(options);
    },
    login: (data: any) => {
      redirectUri = data.redirectUri;
      cookie.set('cs_jwt', 'token1');
    },
    updateToken: () => {
      return new Promise((res) => {
        cookie.remove('cs_jwt');
        cookie.set('cs_jwt', 'updatedToken');
        return res(true);
      });
    },
    clearToken: () => {
      cookie.remove('cs_jwt');
    },
    logout: () => {
      cookie.remove('cs_jwt');
    },
  };
};
/* eslint-enable camelcase */

export default Keycloak;

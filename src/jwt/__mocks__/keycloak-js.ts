import cookie from 'js-cookie';
import { data as encodedToken } from '../../../testdata/encodedToken.json';
class Keycloak {
  scope: any;
  token: any;
  tokenParsed: any;
  refreshToken: any;
  redirectUri: any;
  callback_id: any;
  authenticated: any;
  useNativePromise: any;
  responseMode: any;
  responseType: any;
  flow: any;
  clientId: any;
  authServerUrl: any;
  realm: any;
  endpoints: any;

  constructor(options: any) {
    this.scope = options.scope || 'online';
    this.token = encodedToken;
    this.tokenParsed = options.tokenParsed;
    this.refreshToken = encodedToken;
    this.redirectUri = options.redirectUri;

    this.callback_id = 0;
    this.authenticated = false;
    this.useNativePromise = true;
    this.responseMode = 'fragment';
    this.responseType = 'code';
    this.flow = 'standard';
    this.clientId = 'cloud-services';
    this.authServerUrl = 'https://sso.qa.redhat.com/auth';
    this.realm = 'redhat-external';
    this.endpoints = {};
  }

  init = (options: any) => {
    return Promise.resolve(options);
  };
  login = (data: any) => {
    this.redirectUri = data.redirectUri;
    cookie.set('cs_jwt', 'token1');
    return Promise.resolve({});
  };
  updateToken = () => {
    return new Promise((res) => {
      cookie.remove('cs_jwt');
      cookie.set('cs_jwt', 'updatedToken');
      return res(true);
    });
  };
  clearToken = () => {
    cookie.remove('cs_jwt');
  };
  logout = () => {
    cookie.remove('cs_jwt');
  };
}

export default Keycloak;

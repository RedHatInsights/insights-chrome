import Keycloak, { KeycloakInitOptions, KeycloakInstance, KeycloakLoginOptions } from '@redhat-cloud-services/keycloak-js';

export type PrivCookie = {
  cookieName: string;
};

class Priv {
  _cookie?: string;
  _keycloak: KeycloakInstance;
  cookie?: PrivCookie;

  constructor() {
    this._cookie;
    this._keycloak = {} as KeycloakInstance;
  }

  setCookie(cookie: PrivCookie) {
    this.cookie = cookie;
  }

  setKeycloak(
    options?: string | Record<string, unknown>,
    onTokenExpired?: KeycloakInstance['onTokenExpired'],
    onAuthSuccess?: KeycloakInstance['onAuthSuccess'],
    onAuthRefreshSuccess?: KeycloakInstance['onAuthRefreshSuccess']
  ) {
    this._keycloak = Keycloak(options);
    this._keycloak.onTokenExpired = onTokenExpired;
    this._keycloak.onAuthSuccess = onAuthSuccess;
    this._keycloak.onAuthRefreshSuccess = onAuthRefreshSuccess;
  }

  initializeKeycloak(options: KeycloakInitOptions) {
    this._keycloak?.init(options) as unknown as Promise<boolean>;
  }

  setToken(token: string) {
    this._keycloak.authenticated = true;
    this._keycloak.token = token;
  }

  initialize(options: KeycloakInitOptions) {
    return this._keycloak.init(options);
  }

  setTokenParsed(tokenParsed: KeycloakInstance['tokenParsed']) {
    this._keycloak.tokenParsed = tokenParsed;
  }

  getTokenParsed() {
    return this._keycloak.tokenParsed;
  }

  getToken() {
    return this._keycloak.token;
  }

  getRefershToken() {
    return this._keycloak.refreshToken;
  }

  login(options: KeycloakLoginOptions) {
    return this._keycloak.login(options);
  }

  clearToken() {
    this._keycloak.clearToken();
  }

  getCookie() {
    return this.cookie;
  }

  logout(options: unknown) {
    return this._keycloak.logout(options);
  }

  getAuthenticated() {
    return this._keycloak.authenticated;
  }

  updateToken() {
    // 5 is default KC value, min validaty is required by KC byt then has a default value for some reason
    return this._keycloak.updateToken(5);
  }
}

export default Priv;

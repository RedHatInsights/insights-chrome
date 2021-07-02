import Keycloak from '@redhat-cloud-services/keycloak-js';

class Priv {
  constructor() {
    this._cookie;
    this._keycloak;
  }

  setCookie(cookie) {
    this.cookie = cookie;
  }

  setKeycloak(options, onTokenExpired, onAuthSuccess, onAuthRefreshSuccess) {
    this._keycloak = Keycloak(options);
    this._keycloak.onTokenExpired = onTokenExpired;
    this._keycloak.onAuthSuccess = onAuthSuccess;
    this._keycloak.onAuthRefreshSuccess = onAuthRefreshSuccess;
  }

  initializeKeycloak(options) {
    this._keycloak.init(options);
  }

  setToken(token) {
    this._keycloak.authenticated = true;
    this._keycloak.token = token;
  }

  initialize(options) {
    return this._keycloak.init(options);
  }

  setTokenParsed(tokenParsed) {
    this._keycloak.tokenParsed = tokenParsed;
  }

  getTokenParsed() {
    return this._keycloak.tokenParsed;
  }

  getToken() {
    return this._keycloak.token;
  }

  getRefershToken() {
    this._keycloak.refreshToken;
  }

  login(options) {
    return this._keycloak.login(options);
  }

  clearToken() {
    this._keycloak.clearToken();
  }

  getCookie() {
    return this.cookie;
  }

  logout(options) {
    return this._keycloak.logout(options);
  }

  getAuthenticated() {
    return this._keycloak.authenticated;
  }

  updateToken() {
    return this._keycloak.updateToken();
  }
}

export default Priv;

import consts, { OFFLINE_REDIRECT_STORAGE_KEY } from '../utils/consts';
import insightsUrl from './url';
import axios, { AxiosResponse } from 'axios';
import { DEFAULT_SSO_ROUTES } from '../utils/common';

type Priv = {
  postbackUrl?: string;
  response?: AxiosResponse;
};

const priv: Priv = {};
// note this function is not exposed
// it is a run everytime and produce some side affect thing
// if a special condition is encountered
//
// it would be great to not have this behave this way
// but the order that this needs to run in is very specific
// so that is somewhat difficult
export function wipePostbackParamsThatAreNotForUs() {
  if (getWindow().location.href.indexOf(consts.offlineToken) !== -1) {
    const { hash, origin, pathname } = getWindow().location;
    // attempt to use postback created from in previous doOffline call
    const postbackUrl = new URL(localStorage.getItem(OFFLINE_REDIRECT_STORAGE_KEY) || `${origin}${pathname}`);
    postbackUrl.hash = hash;
    // this is a UHC offline token postback
    // we need to not let the JWT lib see this
    // and try to use it
    priv.postbackUrl = postbackUrl.toString();

    // we do this because keycloak.js looks at the hash for its parameters
    // and if found uses the params for its own use
    //
    // in the UHC offline post back case we *dont*
    // want the params to be used by keycloak.js
    // so we have to destroy this stuff and let regular auth routines happen
    getWindow().location.hash = '';

    // nuke the params so that people dont see the ugly
    const url = new URL(getWindow().location.href);
    url.searchParams.delete(consts.noAuthParam);
    getWindow().history.pushState('offlinePostback', '', url.toString());
  }
}

export async function getOfflineToken(realm: string, clientId: string, configSsoUrl?: string) {
  const postbackUrl = getPostbackUrl();

  if (priv.response) {
    return Promise.resolve(priv.response);
  }

  if (!postbackUrl) {
    // we need this postback URL because it contains parameters needed to
    // call KC for the actual offline token
    // thus we cant continue if it is missing
    return Promise.reject('not available');
  }

  const ssoUrl = await insightsUrl(DEFAULT_SSO_ROUTES, configSsoUrl);

  const tokenURL = `${ssoUrl}/realms/${realm}/protocol/openid-connect/token`;
  const params = parseHashString(postbackUrl);

  return axios
    .post(tokenURL, getPostDataString(getPostDataObject(postbackUrl, clientId, params.code)), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((response) => {
      priv.response = response;
      return response;
    });
}

export function getWindow() {
  return window;
}

export function getPostbackUrl() {
  // let folks only do this once
  const ret = priv.postbackUrl;
  delete priv.postbackUrl;
  return ret;
}

export function getPostDataObject(url: string, clientId: string, code: string) {
  return {
    code: code,
    grant_type: 'authorization_code', // eslint-disable-line camelcase
    client_id: clientId, // eslint-disable-line camelcase
    redirect_uri: encodeURIComponent(url.split('#')[0]), // eslint-disable-line camelcase
  };
}

export function parseHashString(str: string) {
  return str
    .split('#')[1]
    .split('&')
    .reduce<Record<string, string>>((result, item) => {
      const parts = item.split('=');
      result[parts[0]] = parts[1];
      return result;
    }, {});
}

function getPostDataString(obj: Record<string, string>) {
  return Object.entries(obj)
    .map((entry) => {
      return `${entry[0]}=${entry[1]}`;
    })
    .join('&');
}

import { OFFLINE_REDIRECT_STORAGE_KEY, noAuthParam, offlineToken } from '../utils/consts';
import axios, { AxiosResponse } from 'axios';

export type OfflineTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token: string;
  'not-before-policy': number;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
  session_state: string;
  token_type: string;
};

type OfflineSingleton = {
  postbackUrl?: string;
  response?: AxiosResponse<OfflineTokenResponse>;
};

export const offline: OfflineSingleton = {};

export function getPostbackUrl() {
  // let folks only do this once
  const ret = offline.postbackUrl;
  delete offline.postbackUrl;
  return ret;
}

export async function getOfflineToken(tokenUrl: string, clientId: string, redirectUrl: string) {
  const postbackUrl = getPostbackUrl();

  if (offline.response) {
    return Promise.resolve(offline.response);
  }

  if (!postbackUrl) {
    // we need this postback URL because it contains parameters needed to
    // call KC for the actual offline token
    // thus we cant continue if it is missing
    return Promise.reject('not available');
  }
  const params = parseHashString(postbackUrl);

  return axios
    .post<unknown, AxiosResponse<OfflineTokenResponse>>(tokenUrl, getPostDataString(getPostDataObject(redirectUrl, clientId, params.code)), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((response) => {
      offline.response = response;
      return response;
    });
}

export function getPostDataObject(redirectUrl: string, clientId: string, code: string) {
  return {
    code: code,
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUrl,
  };
}

export function parseHashString(str: string) {
  try {
    return str
      .split('#')[1]
      .split('&')
      .reduce<Record<string, string>>((result, item) => {
        const parts = item.split('=');
        result[parts[0]] = parts[1];
        return result;
      }, {});
  } catch {
    console.error('failed to parse hash string', str);
    return {};
  }
}

function getPostDataString(obj: Record<string, string>) {
  return Object.entries(obj)
    .map((entry) => {
      return `${entry[0]}=${entry[1]}`;
    })
    .join('&');
}

export function postbackUrlSetup() {
  if (window.location.href.indexOf(offlineToken) !== -1) {
    const { hash, origin, pathname } = window.location;
    // attempt to use postback created from in previous doOffline call
    const postbackUrl = new URL(localStorage.getItem(OFFLINE_REDIRECT_STORAGE_KEY) || `${origin}${pathname}`);
    postbackUrl.hash = hash;

    // this is a UHC offline token postback
    // we need to not let the JWT lib see this
    // and try to use it
    offline.postbackUrl = postbackUrl.toString();

    // we do this because keycloak.js looks at the hash for its parameters
    // and if found uses the params for its own use
    //
    // in the UHC offline post back case we *dont*
    // want the params to be used by keycloak.js
    // so we have to destroy this stuff and let regular auth routines happen
    window.location.hash = '';

    // nuke the params so that people dont see the ugly
    const url = new URL(window.location.href);
    url.searchParams.delete(noAuthParam);
    url.hash = '';
    window.history.pushState('offlinePostback', '', url.toString());
  }
}

export function prepareOfflineRedirect(base = window.location.href) {
  const url = new URL(base);
  url.hash = '';
  url.searchParams.delete(noAuthParam);
  url.searchParams.append(noAuthParam, offlineToken);
  const redirectUri = url.toString().replace('/?', '?');

  if (redirectUri) {
    localStorage.setItem(OFFLINE_REDIRECT_STORAGE_KEY, redirectUri);
  }
  return redirectUri;
}

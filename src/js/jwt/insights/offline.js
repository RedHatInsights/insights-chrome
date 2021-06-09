import consts from '../../consts';
import { DEFAULT_ROUTES } from '../constants';
import insightsUrl from './url';
import axios from 'axios';
import urijs from 'urijs';

const priv = {};
// note this function is not exposed
// it is a run everytime and produce some side affect thing
// if a special condition is encountered
//
// it would be great to not have this behave this way
// but the order that this needs to run in is very specific
// so that is somewhat difficult
export function wipePostbackParamsThatAreNotForUs() {
  if (getWindow().location.href.indexOf(consts.offlineToken) !== -1) {
    const { hash, search, origin, pathname } = getWindow().location;
    const noAuthParam = new URLSearchParams(search).get(consts.noAuthParam);
    // this is a UHC offline token postback
    // we need to not let the JWT lib see this
    // and try to use it
    priv.postbackUrl = `${origin}${pathname}?${consts.noAuthParam}=${noAuthParam}${hash}`;

    // we do this because keycloak.js looks at the hash for its parameters
    // and if found uses the params for its own use
    //
    // in the UHC offline post back case we *dont*
    // want the params to be used by keycloak.js
    // so we have to destroy this stuff and let regular auth routines happen
    getWindow().location.hash = '';

    // nuke the params so that people dont see the ugly
    const url = urijs(getWindow().location.href);
    url.removeQuery(consts.noAuthParam);
    getWindow().history.pushState('offlinePostback', '', url.toString());
  }
}

export function getOfflineToken(realm, clientId) {
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

  const tokenURL = `${insightsUrl(DEFAULT_ROUTES)}/realms/${realm}/protocol/openid-connect/token`;
  const params = parseHashString(postbackUrl);

  return axios({
    method: 'post',
    url: tokenURL,
    data: getPostDataString(getPostDataObject(postbackUrl, clientId, params.code)),
    config: { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  }).then((response) => {
    priv.response = response;
    return response;
  });
}

function getWindow() {
  return window;
}

function getPostbackUrl() {
  // let folks only do this once
  const ret = priv.postbackUrl;
  delete priv.postbackUrl;
  return ret;
}

function getPostDataObject(url, clientId, code) {
  return {
    code: code,
    grant_type: 'authorization_code', // eslint-disable-line camelcase
    client_id: clientId, // eslint-disable-line camelcase
    redirect_uri: encodeURIComponent(url.split('#')[0]), // eslint-disable-line camelcase
  };
}

function parseHashString(str) {
  return str
    .split('#')[1]
    .split('&')
    .reduce((result, item) => {
      const parts = item.split('=');
      result[parts[0]] = parts[1];
      return result;
    }, {});
}

function getPostDataString(obj) {
  return Object.entries(obj)
    .map((entry) => {
      return `${entry[0]}=${entry[1]}`;
    })
    .join('&');
}

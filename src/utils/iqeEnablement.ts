/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-rest-params */
import type { Store } from 'redux';
import { LibJWT, crossAccountBouncer } from '../auth';
import { setGatewayError } from '../redux/actions';
import { get3scaleError } from './responseInterceptors';
// TODO: Refactor this file to use modern JS

let xhrResults: XMLHttpRequest[] = [];
let fetchResults: Record<string, unknown> = {};

const DENINED_CROSS_CHECK = 'Access denied from RBAC on cross-access check';

const checkOrigin = (path: URL | Request | string = '') => {
  if (path.constructor.name === 'URL') {
    return (path as URL).origin === location.origin;
  } else if (path.constructor.name === 'Request') {
    return (path as Request).url.includes(location.origin);
  } else if (path.constructor.name === 'String') {
    return (path as string).includes(location.origin) || !(path as string).startsWith('http');
  }

  return true;
};

function init(store: Store, libJwt?: () => LibJWT | undefined) {
  const open = window.XMLHttpRequest.prototype.open;
  const send = window.XMLHttpRequest.prototype.send;
  const oldFetch = window.fetch;
  fetchResults = {};

  const iqeEnabled = window.localStorage && window.localStorage.getItem('iqe:chrome:init') === 'true';

  if (iqeEnabled) {
    console.log('[iqe] initialized'); // eslint-disable-line no-console
  }

  // must use function here because arrows dont "this" like functions
  window.XMLHttpRequest.prototype.open = function openReplacement(_method, url) {
    // @ts-ignore
    this._url = url;
    // @ts-ignore
    const req = open.apply(this, arguments);

    return req;
  };

  // must use function here because arrows dont "this" like functions
  window.XMLHttpRequest.prototype.send = function sendReplacement() {
    if (checkOrigin((this as XMLHttpRequest & { _url: string })._url) && libJwt?.()?.jwt.isAuthenticated()) {
      // There is potentially a problem if app sets its own Auth header
      this.setRequestHeader('Authorization', `Bearer ${libJwt?.()?.jwt.getEncodedToken()}`);
    }
    // eslint-disable-line func-names
    if (iqeEnabled) {
      xhrResults.push(this);
    }
    this.onload = function () {
      if (this.status >= 400) {
        const gatewayError = get3scaleError(this.response);
        if (this.status === 403 && this.responseText.includes(DENINED_CROSS_CHECK)) {
          crossAccountBouncer();
          // check for 3scale error
        } else if (gatewayError) {
          store.dispatch(setGatewayError(gatewayError));
        }
      }
    };
    // @ts-ignore
    return send.apply(this, arguments);
  };

  /**
   * Check response errors for cross_account requests.
   * If we get error response with specific cross account error message, we kick the user out of the corss account session.
   */
  window.fetch = function fetchReplacement(path = '', options, ...rest) {
    const tid = Math.random().toString(36);
    const prom = oldFetch.apply(this, [
      path,
      {
        ...(options || {}),
        headers: {
          // If app wants to set its own Auth header it can do so
          ...(checkOrigin(path) && libJwt?.()?.jwt.isAuthenticated() && { Authorization: `Bearer ${libJwt?.()?.jwt.getEncodedToken()}` }),
          ...((options && options.headers) || {}),
        },
      },
      ...rest,
    ]);
    if (iqeEnabled) {
      fetchResults[tid] = arguments[0];
      prom
        .then(function () {
          delete fetchResults[tid];
        })
        .catch(function (err) {
          delete fetchResults[tid];
          throw err;
        });
    }
    return prom
      .then(async (res) => {
        const resCloned = res.clone();
        if (!res.ok) {
          try {
            const isJson = resCloned?.headers?.get('content-type')?.includes('application/json');
            const data = isJson ? await resCloned.json() : await resCloned.text();
            const gatewayError = get3scaleError(data);
            if (gatewayError) {
              store.dispatch(setGatewayError(gatewayError));
            }

            return res;
          } catch (error) {
            console.error('unable to check unauthotized response', error);
            return res;
          }
        }
        return res;
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  };
}

const qe = {
  init,
  hasPendingAjax: () => {
    const xhrRemoved = xhrResults.filter((result) => result.readyState === 4 || result.readyState === 0);
    xhrResults = xhrResults.filter((result) => result.readyState !== 4 && result.readyState !== 0);
    // @ts-ignore
    xhrRemoved.map((e) => console.log(`[iqe] xhr complete:   ${e._url}`));
    // @ts-ignore
    xhrResults.map((e) => console.log(`[iqe] xhr incomplete: ${e._url}`));
    Object.values(fetchResults).map((e) => console.log(`[iqe] fetch incomplete: ${e}`));

    return xhrResults.length > 0 || Object.values(fetchResults).length > 0;
  },
  isPageSafe: () => document.querySelectorAll('[data-ouia-safe=false]').length === 0,
  xhrResults: () => {
    return xhrResults;
  },
  fetchResults: () => {
    return fetchResults;
  },
};

export default qe;

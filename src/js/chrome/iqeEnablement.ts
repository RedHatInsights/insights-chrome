/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-rest-params */
import type { Store } from 'redux';
import { crossAccountBouncer } from '../auth';
import { setGatewayError } from '../redux/actions';
import { get3scaleError } from '../../utils/responseInterceptors';
// TODO: Refactor this file to use modern JS

let xhrResults: XMLHttpRequest[] = [];
let fetchResults: Record<string, unknown> = {};

const DENINED_CROSS_CHECK = 'Access denied from RBAC on cross-access check';

function init(store: Store) {
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
        if (!res.ok) {
          try {
            const isJson = res?.headers?.get('content-type')?.includes('application/json');
            const data = isJson ? await res.json() : await res.text();
            const gatewayError = get3scaleError(data);
            if (gatewayError) {
              store.dispatch(setGatewayError(gatewayError));
            }

            return {
              ...res,
              headers: res.headers,
              ...(isJson ? { json: () => Promise.resolve(data) } : { text: () => Promise.resolve(data) }),
            };
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

export default {
  init: (store: Store) => {
    init(store);
  },
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

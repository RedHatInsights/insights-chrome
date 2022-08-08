/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-rest-params */
import { crossAccountBouncer } from '../auth';

// TODO: Refactor this file to use modern JS

let xhrResults: XMLHttpRequest[] = [];
const fetchResults: Record<string, unknown> = {};
let initted = false;

const DENINED_CROSS_CHECK = 'Access denied from RBAC on cross-access check';

function init() {
  const open = window.XMLHttpRequest.prototype.open;
  const send = window.XMLHttpRequest.prototype.send;
  const oldFetch = window.fetch;

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
      if (this.status === 403 && this.responseText.includes(DENINED_CROSS_CHECK)) {
        crossAccountBouncer();
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
    return prom.catch((err) => {
      console.log(err);
      throw err;
    });
  };
}

export default {
  init: () => {
    if (!initted) {
      initted = true;
      init();
    }
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

let xhrResults = [];
let fetchResults = {};
let initted = false;
let wafkey = null;

function init () {
    console.log('[iqe] initialized'); // eslint-disable-line no-console

    const open = window.XMLHttpRequest.prototype.open;
    const send = window.XMLHttpRequest.prototype.send;
    const oldFetch = window.fetch;

    // must use function here because arrows dont "this" like functions
    window.XMLHttpRequest.prototype.open = function openReplacement(_method, url) { // eslint-disable-line func-names
        this._url = url;
        const req = open.apply(this, arguments);
        if (wafkey) {
            this.setRequestHeader(wafkey, 1);
        }

        return req;
    };

    // must use function here because arrows dont "this" like functions
    window.XMLHttpRequest.prototype.send = function sendReplacement() { // eslint-disable-line func-names
        xhrResults.push(this);
        return send.apply(this, arguments);
    };

    window.fetch = function fetchReplacement(path, options, ...rest) { // eslint-disable-line func-names
        let tid = Math.random().toString(36);
        let prom = oldFetch.apply(this, [path, {
            ...options || {},
            headers: {
                ...(options && options.headers) || {},
                [wafkey]: 1
            }
        }, ...rest]);
        fetchResults[tid] = arguments[0];
        prom.then(function () {
            delete fetchResults[tid];
        }).catch(function (err) {
            delete fetchResults[tid];
            throw err;
        });
        return prom;
    };
}

export default {
    init: () => {
        if (!initted) {
            initted = true;
            if (window.localStorage &&
                window.localStorage.getItem('iqe:chrome:init') === 'true') {
                wafkey = window.localStorage.getItem('iqe:wafkey');
                init();
            }
        }
    },
    hasPendingAjax: () => {
        const xhrRemoved = xhrResults.filter(result => result.readyState === 4 || result.readyState === 0);
        xhrResults = xhrResults.filter(result => result.readyState !== 4 && result.readyState !== 0);
        xhrRemoved.map(e => console.log(`[iqe] xhr complete:   ${e._url}`)); // eslint-disable-line no-console
        xhrResults.map(e => console.log(`[iqe] xhr incomplete: ${e._url}`)); // eslint-disable-line no-console
        Object.values(fetchResults).map(e => console.log(`[iqe] fetch incomplete: ${e}`)); // eslint-disable-line no-console

        return xhrResults.length > 0 || fetchResults.length > 0;
    },
    isPageSafe: () => !document.querySelectorAll('[data-ouia-safe=false]').length !== 0,
    xhrResults: () => {
        return xhrResults;
    },
    fetchResults: () => {
        return fetchResults;
    }

};

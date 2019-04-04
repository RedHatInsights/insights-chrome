let xhrResults = [];
let fetchResults = {};
let initted = false;

function init () {
    console.log('[iqe] initialized'); // eslint-disable-line no-console

    const open = window.XMLHttpRequest.prototype.open;
    const send = window.XMLHttpRequest.prototype.send;
    const oldFetch = window.fetch;

    // must use function here because arrows dont "this" like functions
    window.XMLHttpRequest.prototype.open = function openReplacement(method, url) { // eslint-disable-line func-names
        this._url = url;
        return open.apply(this, arguments);
    };

    // must use function here because arrows dont "this" like functions
    window.XMLHttpRequest.prototype.send = function sendReplacement() { // eslint-disable-line func-names
        xhrResults.push(this);
        return send.apply(this, arguments);
    };

    window.fetch = function fetchReplacement() { // eslint-disable-line func-names
        let tid = Math.random().toString(36);
        let prom = oldFetch.apply(this, arguments);
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
                init();
            }
        }
    },
    hasPendingAjax: () => {
        const xhrRemoved = xhrResults.filter(result => result.readyState === 4);
        xhrResults = xhrResults.filter(result => result.readyState !== 4);
        for (const e of xhrRemoved) {
            console.log(`[iqe] xhr complete:   ${e._url}`);// eslint-disable-line no-console
        }

        for (const e of xhrResults) {
            console.log(`[iqe] xhr incomplete: ${e._url}`);// eslint-disable-line no-console
        }

        for (const e of Object.values(fetchResults)) {
            console.log(`[iqe] fetch incomplete: ${e}`);// eslint-disable-line no-console
        }

        return xhrResults.length > 0 && fetchResults.length > 0;
    },
    xhrResults: () => {
        return xhrResults;
    },
    fetchResults: () => {
        return fetchResults;
    }

};

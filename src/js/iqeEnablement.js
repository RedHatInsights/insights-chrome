let results = [];
let initted = false;

function init () {
    console.log('[iqe] initialized'); // eslint-disable-line no-console

    const open = window.XMLHttpRequest.prototype.open;
    const send = window.XMLHttpRequest.prototype.send;

    // must use function here because arrows dont "this" like functions
    window.XMLHttpRequest.prototype.open = function openReplacement(method, url) { // eslint-disable-line func-names
        this._url = url;
        return open.apply(this, arguments);
    };

    // must use function here because arrows dont "this" like functions
    window.XMLHttpRequest.prototype.send = function sendReplacement() { // eslint-disable-line func-names
        results.push(this);
        return send.apply(this, arguments);
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
        const removed = results.filter(result => result.readyState === 4);
        results = results.filter(result => result.readyState !== 4);
        for (const e of removed) { console.log(`[iqe] complete:   ${e._url}`); } // eslint-disable-line no-console

        for (const e of results) { console.log(`[iqe] incomplete: ${e._url}`); } // eslint-disable-line no-console

        return results.length > 0;
    }
};

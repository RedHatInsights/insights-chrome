let results = [];

function init () {
    window.localStorage.setItem('iqe:chrome:init', 'true');
    console.log('[iqe] initialized'); // eslint-disable-line no-console

    const open = window.XMLHttpRequest.prototype.open;
    const send = window.XMLHttpRequest.prototype.send;

    // must use function here because arrows dont "this" like functions
    window.XMLHttpRequest.prototype.open = function(_method, url) {
        this._url = url;
        return open.apply(this, arguments);
    };

    // must use function here because arrows dont "this" like functions
    window.XMLHttpRequest.prototype.send = function() {
        results.push(this);
        return send.apply(this, arguments);
    };
}

export default {
    init: () => {
        if (window.localStorage.getItem('iqe:chrome:init') !== 'true') {
            init();
        }
    },
    hasPendingAjax: () => {
        results
        .filter(result => result.readyState === 4)
        .forEach(e => console.log(`[iqe] complete:   ${e._url}`)); // eslint-disable-line no-console

        results
        .filter(result => result.readyState !== 4)
        .forEach(e => console.log(`[iqe] incomplete:   ${e._url}`)); // eslint-disable-line no-console

        return results.length > 0;
    }
};

/*global module*/
const urijs = (inputUrl) => {
    console.log('Called constructor with param: ' + inputUrl);
    let url = inputUrl;
    let searchMap = {
        foo: 'bar'
    };
    return {
        removeSearch: (key) => {
            delete searchMap[key];
        },
        addSearch: (key, val) => {
            searchMap[key] = val;
        },
        toString: () => {
            return url;
        }
    };
};
/* eslint-enable camelcase */

module.exports = urijs;

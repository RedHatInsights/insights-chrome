const urijs = (inputUrl) => {
  let url = inputUrl;
  let searchMap = {
    foo: 'bar',
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
    },
  };
};
/* eslint-enable camelcase */

export default urijs;

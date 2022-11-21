const urijs = (inputUrl: string) => {
  const url = inputUrl;
  const searchMap: { [key: string]: any } = {
    foo: 'bar',
  };
  return {
    removeSearch: (key: string) => {
      delete searchMap[key];
    },
    addSearch: (key: string, val: any) => {
      searchMap[key] = val;
    },
    toString: () => {
      return url;
    },
  };
};
/* eslint-enable camelcase */

export default urijs;

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const glob = require('glob');

const imageNullLoader = () => {
  const modulesPath = path.join(__dirname, '../node_modules/@patternfly/patternfly');
  return glob.sync(`${modulesPath}/**/*+(.jpg|.png|.svg|.jpeg)`).reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: false,
    }),
    {}
  );
};

module.exports = imageNullLoader;

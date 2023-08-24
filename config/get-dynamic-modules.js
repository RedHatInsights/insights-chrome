/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const glob = require('glob');
const fs = require('fs');

const getDynamicModules = (root) => {
  if (!root) {
    throw new Error('Provide a directory of your node_modules to find dynamic modules');
  }

  const package = fs.readFileSync(path.resolve(root, 'package.json'), { encoding: 'utf-8' });
  const packageJSON = JSON.parse(package);
  const coreVersion = packageJSON.dependencies['@patternfly/react-core'];
  const iconsVersion = packageJSON.dependencies['@patternfly/react-icons'];

  const componentsGlob = path.resolve(root, 'node_modules/@patternfly/react-core/dist/dynamic/*/**/package.json');
  const iconsGlob = path.resolve(root, 'node_modules/@patternfly/react-icons/dist/dynamic/*/**/package.json');

  const files = [
    { requiredVersion: coreVersion, files: glob.sync(componentsGlob) },
    { requiredVersion: iconsVersion, files: glob.sync(iconsGlob) },
  ];
  const modules = files
    .map(({ files, requiredVersion }) =>
      files.reduce((acc, curr) => {
        const moduleName = curr
          .replace(/\/package.json$/, '')
          .split('/node_modules/')
          .pop();
        return {
          ...acc,
          [moduleName]: {
            version: requiredVersion,
          },
        };
      }, {})
    )
    .reduce(
      (acc, curr) => ({
        ...acc,
        ...curr,
      }),
      {}
    );

  return modules;
};

module.exports = getDynamicModules;

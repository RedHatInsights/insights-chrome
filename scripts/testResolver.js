module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    packageFilter: (pkg) => {
      if (pkg.name === '@rhds/tokens') {
        for (const path in pkg.exports) {
          pkg.exports[path].default ||= pkg.exports[path].import;
        }
        pkg.exports['./media.js'].default = pkg.exports['./media.js'].import;
      }
      // https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
      if (pkg.name === 'uuid') {
        delete pkg['exports'];
        delete pkg['module'];
      }
      return pkg;
    },
  });
};

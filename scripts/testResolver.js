const path = require('path');

/**
 * Jest 30 dropped packageFilter support, so we resolve @rhds/tokens
 * subpath imports manually. The package only provides ESM exports for
 * some subpaths (e.g. ./media.js), which Jest's CJS resolver cannot
 * find via the exports map.
 *
 * We derive the js/ directory from require.resolve('@rhds/tokens') so
 * the path stays correct in monorepos or non-standard install layouts.
 */
const rhdsTokensJsDir = path.dirname(require.resolve('@rhds/tokens'));

module.exports = (request, options) => {
  if (request.startsWith('@rhds/tokens/') && request.endsWith('.js')) {
    const subpath = request.replace('@rhds/tokens/', '');
    // Only redirect top-level .js subpaths (e.g. media.js) to js/ directory.
    // Nested paths like css/*.css.js resolve directly from the package root.
    if (!subpath.includes('/')) {
      return path.join(rhdsTokensJsDir, subpath);
    }
  }

  return options.defaultResolver(request, options);
};

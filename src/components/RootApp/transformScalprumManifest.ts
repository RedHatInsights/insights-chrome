import { PluginManifest } from '@openshift/dynamic-plugin-sdk';

import { ScalprumConfig } from '../../state/atoms/scalprumConfigAtom';

function transformScalprumManifest(manifest: PluginManifest, config: ScalprumConfig) {
  if (manifest.name === 'chrome') {
    return {
      ...manifest,
      // Do not include chrome chunks in manifest for chrome. It will result in an infinite loading loop
      // window.chrome always exists because chrome container is always initialized
      loadScripts: [],
    };
  }
  const newManifest = {
    ...manifest,
    // Compatibility required for bot pure SDK plugins, HCC plugins and sdk v1/v2 plugins until all are on the same system.
    baseURL: manifest.name.includes('hac-') && !manifest.baseURL ? `/api/plugins/${manifest.name}/` : '/',
    loadScripts: manifest.loadScripts?.map((script) => `${manifest.baseURL}${script}`.replace(/\/\//, '/')) ?? [`${manifest.baseURL ?? ''}plugin-entry.js`],
    registrationMethod: manifest.registrationMethod ?? 'callback',
  };

  // Handle modules that cna be served from unknown path at build time
  // Should be the default for "hybrid" modules that can live in multiple products
  if (manifest.baseURL === 'auto') {
    let cdnPath = config[manifest.name]?.cdnPath;
    if (!cdnPath) {
      console.error('Manifest baseURL is set to auto but no cdnPath is provided in customProperties for plugin', manifest.name);
    } else {
      if (!cdnPath.endsWith('/')) {
        cdnPath += '/';
        console.warn('cdnPath should end with /, appending / to cdnPath');
      }
      newManifest.baseURL = cdnPath;
      newManifest.loadScripts = manifest.loadScripts.map((script) => `${cdnPath}${script}`);
    }
  }
  return newManifest;
}

export default transformScalprumManifest;

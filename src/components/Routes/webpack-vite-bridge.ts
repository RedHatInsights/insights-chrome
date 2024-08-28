/* eslint-disable no-var */
import { ViteRemote, ViteShareScope } from './types';

export type ViteRemotesMap = {
  [remoteName: string]: ViteRemote;
};

export type ViteFederation = {
  // init the remote
  ensure: (remoteId: string, module: string) => Promise<any>;
  remotesMap: ViteRemotesMap;
  shareScope: ViteShareScope;
};

declare global {
  var __federation__: ViteFederation;
  var __federation_shared__: any;
}

const importTypes = ['esm'];

export const initializeViteFederation = (baseAppName: string, shareScopeName: string, remotesConfig: ViteRemotesMap) => {
  console.log({
    vf: globalThis.__federation__,
    fs: globalThis?.__federation_shared__,
    // @ts-ignore
    v: window.__federation_shared__,
  });
  const internalRemotesMap = {
    ...remotesConfig,
  };
  const federationShareScope = globalThis.__FEDERATION__.__SHARE__[baseAppName][shareScopeName];
  console.log({federationShareScope})

  const viteShareScope: ViteShareScope = {};

  for (const pkgName in federationShareScope) {
    const versions = federationShareScope[pkgName];
    for (const version in versions) {
      const pkg = versions[version];
      if (!viteShareScope[pkgName]) {
        viteShareScope[pkgName] = {};
      }

      // console.log({ pkg, versions, version, pkgName });
      // Do something with pkg
      viteShareScope[pkgName][version] = {
        get: pkg.get,
        metaGet: pkg.get!,
        loaded: 1,
      };
    }
  }

  const ensure = async (remoteId: string, module: string) => {
    const remote = internalRemotesMap[remoteId];
    if (!remote.loaded) {
      if (importTypes.includes(remote.format)) {
        // loading js with import(...)
        return new Promise((resolve) => {
          // the ignore comments are necessary to stop the bundler from trying to reach local dependencies/modules
          return import(
            /* @vite-ignore */
            /* webpackIgnore: true */
            remote.url
          ).then((lib) => {
            if (!remote.loaded) {
              remote.lib = lib;
              if (remote.lib) {
                remote.lib.init(viteShareScope);
                remote.loaded = true;
                remote.lib.get(module).then((m) => {
                  return m;
                });
              }
            }
            resolve(remote.lib);
          });
        });
      }
    } else {
      return remote.lib?.get(module);
    }
  };

  const viteApi: ViteFederation = {
    ensure,
    remotesMap: internalRemotesMap,
    shareScope: viteShareScope,
  };

  globalThis.__federation__ = viteApi;
  return viteApi;
};

import { atom } from 'jotai';
import { ChromeModule } from '../../@types/types';
import isEqual from 'lodash/isEqual';
import { AppsConfig } from '@scalprum/core';

export type ScalprumConfig = AppsConfig<{
  name: string;
  manifestLocation: string;
  module?: string;
  cdnPath?: string;
}>;

export const scalprumConfigAtom = atom<ScalprumConfig>({});

// Write only scalprum config atom. Its used to mutate the initial metadata retrieved from chrome service
export const writeInitialScalprumConfigAtom = atom(
  null,
  (
    get,
    set,
    schema: {
      [key: string]: ChromeModule;
    }
  ) => {
    const scalprumConfig = Object.entries(schema).reduce(
      (acc, [name, moduleEntry]) => ({
        ...acc,
        [name]: {
          name,
          module: `${name}#./RootApp`,
          manifestLocation: `${window.location.origin}${moduleEntry.manifestLocation}`,
          cdnPath: moduleEntry?.cdnPath,
        },
      }),
      {
        chrome: {
          name: 'chrome',
          manifestLocation: `${window.location.origin}/apps/chrome/js/fed-mods.json`,
        },
      }
    );
    // need to compare the config to prevent unnecessary re-renders, on identity refresh
    const prevConfig = get(scalprumConfigAtom);
    if (!isEqual(prevConfig, scalprumConfig)) {
      set(scalprumConfigAtom, scalprumConfig);
    }
  }
);

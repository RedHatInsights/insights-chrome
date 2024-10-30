import { atom } from 'jotai';
import { ChromeModule } from '../../@types/types';
import isEqual from 'lodash/isEqual';

export type ScalprumConfig = {
  [key: string]: {
    name: string;
    manifestLocation: string;
    module?: string;
  };
};

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
      (acc, [name, config]) => ({
        ...acc,
        [name]: {
          name,
          module: `${name}#./RootApp`,
          manifestLocation: `${window.location.origin}${config.manifestLocation}`,
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

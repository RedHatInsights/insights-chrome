import { atom } from 'jotai';
import { ChromeModule } from '../../@types/types';

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
    _get,
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
          manifestLocation: `${window.location.origin}${config.manifestLocation}?ts=${Date.now()}`,
        },
      }),
      {
        chrome: {
          name: 'chrome',
          manifestLocation: `${window.location.origin}/apps/chrome/js/fed-mods.json?ts=${Date.now()}`,
        },
      }
    );
    set(scalprumConfigAtom, scalprumConfig);
  }
);

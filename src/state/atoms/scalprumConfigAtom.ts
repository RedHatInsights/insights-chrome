import { atom } from 'jotai';
import { ChromeModule } from '../../@types/types';
import { isBeta } from '../../utils/common';

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
    const LOCAL_PREVIEW = localStorage.getItem('chrome:local-preview') === 'true';
    // TODO: Remove this once the local preview is enabled by default
    // Assets will be loaded always from root '/' in local preview mode
    const previewFragment = LOCAL_PREVIEW ? '' : isBeta() ? '/beta' : '';
    const scalprumConfig = Object.entries(schema).reduce(
      (acc, [name, config]) => ({
        ...acc,
        [name]: {
          name,
          module: `${name}#./RootApp`,
          manifestLocation: `${window.location.origin}${previewFragment}${config.manifestLocation}?ts=${Date.now()}`,
        },
      }),
      {
        chrome: {
          name: 'chrome',
          manifestLocation: `${window.location.origin}${previewFragment}/apps/chrome/js/fed-mods.json?ts=${Date.now()}`,
        },
      }
    );
    set(scalprumConfigAtom, scalprumConfig);
  }
);

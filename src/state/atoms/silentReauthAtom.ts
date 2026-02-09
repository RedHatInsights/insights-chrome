import { atomWithStorage } from 'jotai/utils';
import { SILENT_REAUTH_ENABLED_KEY } from '../../utils/consts';

export const silentReauthEnabledAtom = atomWithStorage<boolean>(
  SILENT_REAUTH_ENABLED_KEY,
  false, // default value if localStorage is empty
  {
    getItem: (key) => {
      const value = localStorage.getItem(key);
      return value === 'true';
    },
    setItem: (key, value) => {
      localStorage.setItem(key, value ? 'true' : 'false');
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  }
);

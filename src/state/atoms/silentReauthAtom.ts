import { atomWithStorage } from 'jotai/utils';
import { OIDC_SILENT_ENABLED_KEY } from '../../utils/consts';

const isLocalStorageAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.localStorage;
};

export const silentReauthEnabledAtom = atomWithStorage<boolean>(
  OIDC_SILENT_ENABLED_KEY,
  false, // default value if localStorage is empty
  {
    getItem: (key) => {
      if (!isLocalStorageAvailable()) {
        return false;
      }
      try {
        const value = localStorage.getItem(key);
        return value === 'true';
      } catch {
        return false;
      }
    },
    setItem: (key, value) => {
      if (!isLocalStorageAvailable()) {
        return;
      }
      try {
        localStorage.setItem(key, value ? 'true' : 'false');
      } catch {
        // Swallow errors to prevent crashes if localStorage is blocked
      }
    },
    removeItem: (key) => {
      if (!isLocalStorageAvailable()) {
        return;
      }
      try {
        localStorage.removeItem(key);
      } catch {
        // Swallow errors to prevent crashes if localStorage is blocked
      }
    },
  }
);

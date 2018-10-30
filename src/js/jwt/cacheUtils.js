import localforage from 'localforage/dist/localforage';

// const MINUTES_1 = 60 * 1000;
// const HOURS_1 = 60 * MINUTES_1;
// const DAYS_1 = 24 * HOURS_1;
// const MONTHS_1 = 30 * DAYS_1;

export const CACHE_STORAGE_NAME = 'jwt-redhat-lf';

localforage.config({
    driver: localforage.LOCALSTORAGE,
    name: 'jwt-redhat-lf'
});

/* eslint-disable no-console */
export class CacheUtils {

    static set(key, obj) {
        if (!obj.lastModifiedDate) {
            obj.lastModifiedDate = (new Date()).toISOString();
        }

        try {
            return localforage.setItem(key, obj);
        } catch (e) {
            console.warn(`Unable to set ${key} due to: ${e.message}`);
        }
    }

    static get(key) {
        try {
            return localforage.getItem(key);
        } catch (e) {
            console.warn(`Unable to get ${key} due to: ${e.message}`);
        }
    }

    static delete(key) {
        try {
            return localforage.removeItem(key);
        } catch (e) {
            console.warn(`Unable to delete ${key} due to: ${e.message}`);
        }
    }

    static clear() {
        try {
            return localforage.clear();
        } catch (e) {
            console.warn(`Unable to clear all cache: ${e.message}`);
        }
    }

    static keys(text) {
        try {
            if (text) {
                return localforage.keys().then((keys) => {
                    if (keys) {
                        return keys.filter((key) => key.indexOf(text) !== -1);
                    } else {
                        return [];
                    }
                });
            } else {
                return localforage.keys();
            }
        } catch (e) {
            console.warn(`Unable to get keys containing ${text} due to: ${e.message}`);
        }
    }

    static setInSessionStorage(key, value) {
        try {
            sessionStorage.setItem(key, value);
        } catch (e) {
            console.warn(`Could not set key: ${key}, value: ${value} in sessionStorage`);
        }
    }
    static getInSessionStorage(key) {
        try {
            return sessionStorage.getItem(key);
        } catch (e) {
            console.warn(`Could not get key: ${key} in sessionStorage`);
        }
    }
}
/* eslint-enable no-console */

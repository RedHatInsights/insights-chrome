import * as localforage from 'localforage';

// const MINUTES_1 = 60 * 1000;
// const HOURS_1 = 60 * MINUTES_1;
// const DAYS_1 = 24 * HOURS_1;
// const MONTHS_1 = 30 * DAYS_1;

export const CACHE_STORAGE_NAME = 'jwt-redhat-lf';

localforage.config({
    driver: localforage.LOCALSTORAGE,
    name: 'jwt-redhat-lf'
});

export interface ICacheOptions {
    expireAt?: number;
}

export interface IBaseCache<T> {
    lastModifiedDate?: string; // in iso format
    value: T;
    expiresAt?: number; // value of +(new Date());
}

export interface IStringCache extends IBaseCache<string> {}
export interface IBooleanCache extends IBaseCache<boolean> {}
export interface INumberCache extends IBaseCache<number> {}

export class CacheUtils {

    static set<S extends IBaseCache<T>, T>(key: string, obj: S, options?: ICacheOptions): Promise<S> {
        if (!obj.lastModifiedDate) {
            obj.lastModifiedDate = (new Date()).toISOString();
        }
        try {
            return localforage.setItem(key, obj);
        } catch (e) {
            console.warn(`Unable to set ${key} due to: ${e.message}`);
        }
    }

    static get<S>(key: string): Promise<S> {
        try {
            return localforage.getItem<S>(key);
        } catch (e) {
            console.warn(`Unable to get ${key} due to: ${e.message}`);
        }
    }

    static delete(key: string): Promise<void> {
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

    static keys(text?: string): Promise<string[]> {
        try {
            if (text) {
                return localforage.keys().then((keys: string[]) => {
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

    static setInSessionStorage(key: string, value: string) {
        try {
            sessionStorage.setItem(key, value);
        } catch (e) {
            console.warn(`Could not set key: ${key}, value: ${value} in sessionStorage`);
        }
    }
    static getInSessionStorage(key: string) {
        try {
            return sessionStorage.getItem(key);
        } catch (e) {
            console.warn(`Could not get key: ${key} in sessionStorage`);
        }
    }

    // static async expireCache(): Promise<void> {
    //     try {
    //         const keys = await CacheUtils.keys();
    //         if (keys) {
    //             keys.forEach((k) => {
    //                 localforage.getItem(k).then((c: IBaseCache<any>) => {
    //                     if (c.expiresAt && +(new Date()) > c.expiresAt) {
    //                         localforage.removeItem(k);
    //                     }
    //                 });
    //             });
    //         }
    //     } catch (e) {
    //         console.warn(`Could not expire indexdb cache: ${e.message}`);
    //     }
    // }
}
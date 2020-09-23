import { headerLoader } from '../App/Header';
import { allowUnauthed } from '../auth';
import { decodeToken } from '../jwt/jwt';
import { spinUpStore } from '../redux-config';
import { CacheAdapter } from '../utils/cache';

/**
 * Initialize JWT
 * @param {object} libjwt JWT API
 * @param {object} chromeInstance persistent chrome object
 * @returns {Promise}
 */
const initializeJWT = (libjwt, chromeInstance) => {
    const { actions } = spinUpStore();
    let chromeCache;
    return libjwt.initPromise
    .then(async () => {
        const user = await libjwt.jwt.getUserInfo();
        actions.userLogIn(user);
        chromeCache = new CacheAdapter(
            'chrome-store',
        `${decodeToken(libjwt.jwt.getEncodedToken())?.session_state}-chrome-store`
        );
        headerLoader();
        chromeInstance.cache = chromeCache;
    })
    .catch((err) => {
        console.log(err);
        if (allowUnauthed()) {
            actions.userLogIn(false);
            headerLoader();
        }
        chromeInstance.cache = chromeCache;
    });
};

export default initializeJWT;

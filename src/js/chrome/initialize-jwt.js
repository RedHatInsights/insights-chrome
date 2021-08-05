import { decodeToken } from '../jwt/jwt';
import { spinUpStore } from '../redux-config';
import { CacheAdapter } from '../utils/cache';

/**
 * Initialize JWT
 * @param {object} libjwt JWT API
 * @param {object} chromeInstance persistent chrome object
 * @returns {Promise}
 */
const initializeJWT = async (libjwt, chromeInstance) => {
  const { actions } = spinUpStore();
  try {
    await libjwt.initPromise;
    const user = await libjwt.jwt.getUserInfo();
    actions.userLogIn(user);
    chromeInstance.cache = new CacheAdapter('chrome-store', `${decodeToken(libjwt.jwt.getEncodedToken())?.session_state}-chrome-store`);
  } catch {
    actions.userLogIn(false);
  }
};

export default initializeJWT;

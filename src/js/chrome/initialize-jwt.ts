import { ChromeUser } from '@redhat-cloud-services/types';
import { LibJWT } from '../auth';
import { decodeToken } from '../jwt/jwt';
import { spinUpStore } from '../redux-config';
import { CacheAdapter } from '../utils/cache';

const initializeJWT = async (libjwt: LibJWT, chromeInstance: { cache?: CacheAdapter }) => {
  const { actions } = spinUpStore();
  try {
    await libjwt.initPromise;
    const user = await libjwt.jwt.getUserInfo();
    if (user) {
      actions.userLogIn(user as ChromeUser);
    }
    const decodedToken = libjwt.jwt.getEncodedToken();
    if (decodedToken) {
      chromeInstance.cache = new CacheAdapter('chrome-store', `${decodeToken(decodedToken).session_state}-chrome-store`);
    }
  } catch {
    actions.userLogIn(false);
  }
};

export default initializeJWT;

import { ChromeUser } from '@redhat-cloud-services/types';
import { LibJWT } from '../auth';
import { decodeToken } from './jwt';
import { spinUpStore } from '../redux/redux-config';
import { CacheAdapter } from '../utils/cache';

const initializeJWT = async (libjwt: LibJWT, chromeInstance: { cache?: CacheAdapter }) => {
  const { actions } = spinUpStore();
  try {
    await libjwt.initPromise;
    const user = await libjwt.jwt.getUserInfo();
    if (user) {
      actions.userLogIn(user as ChromeUser);
    }
    const encodedToken = libjwt.jwt.getEncodedToken();
    if (encodedToken) {
      chromeInstance.cache = new CacheAdapter('chrome-store', `${decodeToken(encodedToken).session_state}-chrome-store`);
    }
  } catch (error) {
    console.error(error);
    actions.userLogIn(false);
  }
};

export default initializeJWT;

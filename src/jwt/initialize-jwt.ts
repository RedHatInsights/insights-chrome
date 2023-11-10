import { ChromeUser } from '@redhat-cloud-services/types';
import { LibJWT } from '../auth';
import { spinUpStore } from '../redux/redux-config';
import { ITLessCognito } from '../utils/common';
import { createUser, getTokenWithAuthorizationCode } from '../cognito/auth';

const initializeJWT = async (libjwt: LibJWT) => {
  const { actions } = spinUpStore();
  if (ITLessCognito()) {
    try {
      await getTokenWithAuthorizationCode();
      const user = await createUser();
      if (user) {
        actions.userLogIn(user as ChromeUser);
      }
    } catch (error) {
      console.error(error);
      actions.userLogIn(false);
    }
  } else {
    try {
      await libjwt.initPromise;
      const user = await libjwt.jwt.getUserInfo();
      if (user) {
        actions.userLogIn(user as ChromeUser);
      }
      const encodedToken = libjwt.jwt.getEncodedToken();
      if (encodedToken) {
        // chromeInstance.cache = new CacheAdapter('chrome-store', `${decodeToken(encodedToken).session_state}-chrome-store`);
      }
    } catch (error) {
      console.error(error);
      actions.userLogIn(false);
    }
  }
};

export default initializeJWT;

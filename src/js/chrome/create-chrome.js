import { loadNav } from '../nav/globalNav';
import qe from './iqeEnablement';
import sourceOfTruth from '../nav/sourceOfTruth';
import { spinUpStore } from '../redux-config';
import { chromeInit, bootstrap } from './entry';
import initializeJWT from './initialize-jwt';
import { createFetchPermissionsWatcher } from '../rbac/fetchPermissions';

/**
 * Create a chrome API instance
 * @param {object} jwt JWT auth functions
 * @param {object} insights existing insights instance
 */
const createChromeInstance = (jwt, insights) => {
  const {
    actions: { chromeNavUpdate },
  } = spinUpStore();
  const libjwt = jwt;
  const chromeInstance = {
    cache: undefined,
  };

  const jwtResolver = initializeJWT(libjwt, chromeInstance);

  /**
   * Load navigation after login
   */
  const navResolver = jwtResolver.then(async () => {
    const navigationYml = await sourceOfTruth(libjwt.jwt.getEncodedToken());
    const navigationData = await loadNav(navigationYml, chromeInstance.cache);
    chromeNavUpdate(navigationData);
  });

  const init = () => {
    window.insights.chrome = {
      ...window.insights.chrome,
      ...chromeInit(navResolver),
    };
  };

  /**
   * here we need to init the qe plugin
   * the "contract" is we will do this before anyone
   * calls/finishes getUser
   * this only does something if the correct localstorage
   * vars are set
   */
  const getUser = () => {
    qe.init();
    return libjwt.initPromise.then(libjwt.jwt.getUserInfo).catch(() => {
      libjwt.jwt.logoutAllTabs();
    });
  };

  /**
   * Guard async cache dependent functions until cache is created
   * @param {function} fn function that requires global chrome cache
   * @returns {Promise}
   */
  const bufferAsyncFunction = (fn) => {
    if (chromeInstance.cache) {
      return fn;
    }
    /**
     * Wait for JWT initialization to happen and cache initialization in chrome instance
     */
    return (...args) => jwtResolver.then(() => fn(...args));
  };

  const fetchPermissions = bufferAsyncFunction(createFetchPermissionsWatcher(chromeInstance));

  const chromeFunctions = bootstrap(libjwt, init, getUser);

  chromeFunctions.chrome.getUserPermissions = async (app = '', bypassCache) => {
    await getUser();
    return fetchPermissions(libjwt.jwt.getEncodedToken(), app, bypassCache);
  };

  return {
    ...insights,
    ...chromeFunctions,
  };
};

export default createChromeInstance;

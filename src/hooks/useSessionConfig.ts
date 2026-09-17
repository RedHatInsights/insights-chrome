import { useContext, useEffect, useState } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { initChromeUserConfig, initVisibilityFunctions } from '../utils/initUserConfig';
import { isPreviewAtom } from '../state/atoms/releaseAtom';
import { userConfigAtom } from '../state/atoms/userConfigAtom';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { gatewayErrorAtom } from '../state/atoms/gatewayErrorAtom';
import { setServiceDegradedAtom } from '../state/atoms/degradedStateAtom';
import { configInitializedAtom } from '../state/atoms/configInitializedAtom';
import { visibilityFunctionsExist } from '../utils/VisibilitySingleton';

const useSessionConfig = () => {
  const gatewayError = useAtomValue(gatewayErrorAtom);
  const [configLoaded, setConfigLoaded] = useState(false);
  const { getUser, getToken } = useContext(ChromeAuthContext);
  const store = useStore();
  const initPreview = useSetAtom(isPreviewAtom);
  const setUserConfig = useSetAtom(userConfigAtom);
  const setServiceDegraded = useSetAtom(setServiceDegradedAtom);
  // Run the config init only once per page load. The guard lives on the singleton chromeStore
  // (configInitializedAtom), not a component-scoped ref, so an App remount cannot re-run it.
  // There is no in-session retry: a failed fetch renders the shell degraded, and a normal next
  // page load re-attempts the fetch from scratch.

  async function initConfig() {
    // Initialize the visibility functions independently of the user config fetch so navigation
    // renders even when the personalization API is down. `getToken` is the live token getter from
    // ChromeAuthContext, so the visibility functions always read the current token (even after a
    // silent renew) rather than a frozen snapshot.
    if (!visibilityFunctionsExist()) {
      initVisibilityFunctions({ getUser, getToken });
    }

    try {
      const config = await initChromeUserConfig();
      setUserConfig(config);
      // Set preview exactly once, and only on an actual change. This avoids the redundant
      // onToggle side effects (cache clear + update-ui-preview POST) and the transient render
      // flip that a false-then-value double set would cause, plus a redundant POST on remount.
      if (store.get(isPreviewAtom) !== config.data.uiPreview) {
        initPreview(config.data.uiPreview);
      }
      setConfigLoaded(true);
    } catch (error) {
      // A real 3scale gateway outage is recorded on the store by the XHR interceptor before the
      // request rejects. Leave configLoaded false so bootstrap renders the full-page
      // GatewayErrorComponent instead of a broken degraded shell.
      if (store.get(gatewayErrorAtom)) {
        return;
      }
      // The personalization API is optional. Render the shell with production defaults and flag the
      // degraded state. Force preview OFF while degraded (the toggle is also disabled in the UI);
      // guarded so the side effect only fires on an actual change. On a truly-down service the
      // update-ui-preview POST fails harmlessly (swallowed by isPreviewAtom's onToggle).
      console.error('Failed to fetch user configuration; rendering with defaults', error);
      setServiceDegraded({ service: 'userPersonalization', degraded: true });
      if (store.get(isPreviewAtom) !== false) {
        initPreview(false);
      }
      setConfigLoaded(true);
    }
  }

  useEffect(() => {
    if (store.get(configInitializedAtom)) {
      return;
    }
    // Set synchronously, before the async init, so a concurrent remount cannot double-fire it.
    store.set(configInitializedAtom, true);
    initConfig();
    // Run once per page load; getToken is a stable live getter, so token changes need no re-run.
  }, []);

  return { gatewayError, configLoaded };
};

export default useSessionConfig;

import { useContext, useEffect, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChromeUserConfig, initChromeUserConfig } from '../utils/initUserConfig';
import { isPreviewAtom } from '../state/atoms/releaseAtom';
import { userConfigAtom } from '../state/atoms/userConfigAtom';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { gatewayErrorAtom } from '../state/atoms/gatewayErrorAtom';

const useSessionConfig = () => {
  const gatewayError = useAtomValue(gatewayErrorAtom);
  const [configLoaded, setConfigLoaded] = useState(false);
  const { getUser, token } = useContext(ChromeAuthContext);
  const initPreview = useSetAtom(isPreviewAtom);
  const setUserConfig = useSetAtom(userConfigAtom);
  function initSuccess(userConfig: ChromeUserConfig) {
    if (!configLoaded) {
      // do not re-initialize preview if already loaded
      // it can "restart" active user sessions. Because toggling preview re-rendes the UI modules, it can cause issues
      initPreview(userConfig.data.uiPreview);
    }
    setUserConfig(userConfig);
  }
  function initFail() {
    initPreview(false);
  }

  async function initConfig() {
    try {
      const config = await initChromeUserConfig({ getUser, token });
      initSuccess(config);
      setConfigLoaded(true);
    } catch (error) {
      initFail();
      throw error;
    }
  }

  useEffect(() => {
    initConfig();
  }, [getUser, token]);

  return { gatewayError, configLoaded };
};

export default useSessionConfig;

import { asyncLoader, getAppData, getCachedModule, processManifest } from '@scalprum/core';
import { useCallback, useState } from 'react';
import { RouteDefinition } from '../redux/store';

const preloadModule = async (scope: string, module: string, processor?: (item: any) => string, skipCache = false) => {
  const { manifestLocation } = getAppData(scope);
  const cachedModule = getCachedModule(scope, module, skipCache);

  if (!cachedModule && manifestLocation) {
    await processManifest(manifestLocation, scope, scope, processor);
    return asyncLoader(scope, module);
  }
};

const useModulePreload = (moduleEntry?: RouteDefinition) => {
  const [isLoading, setIsLoading] = useState(false);
  const handlePreload = useCallback(async () => {
    if (moduleEntry && moduleEntry.scope && moduleEntry.module && !isLoading) {
      setIsLoading(true);
      try {
        await preloadModule(moduleEntry.scope, moduleEntry.module);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.log('Unable to preload module: ', moduleEntry.scope, moduleEntry.module, error);
      }
    }
  }, [moduleEntry?.scope, moduleEntry?.path]);
  return handlePreload;
};

export default useModulePreload;

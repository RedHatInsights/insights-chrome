import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { setServiceDegradedAtom } from '../../state/atoms/degradedStateAtom';
import { subscribeConfigCacheStatus } from '../../utils/configCacheStatus';

const ConfigCacheDegradedStateBridge = () => {
  const setServiceDegraded = useSetAtom(setServiceDegradedAtom);

  useEffect(() => {
    return subscribeConfigCacheStatus((degraded) => {
      setServiceDegraded({ service: 'configFromCache', degraded });
    });
  }, [setServiceDegraded]);

  return null;
};

export default ConfigCacheDegradedStateBridge;

import React, { useContext, useEffect, useMemo } from 'react';
import { FlagProvider, UnleashClient } from '@unleash/proxy-client-react';
import { DeepRequired } from 'utility-types';
import { useAtomValue, useSetAtom } from 'jotai';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import { setServiceDegradedAtom } from '../../state/atoms/degradedStateAtom';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { setFeatureFlagsError, setUnleashClient } from './unleashClient';
import { getFeatureFlagsClient, isFeatureFlagsClientStarted, startFeatureFlagsClient, stopFeatureFlagsClient } from './featureFlagsClient';

export { createFetchFeatureFlags } from './featureFlagsClient';

const isMetricsError = (error: unknown) => typeof error === 'object' && error !== null && 'type' in error && error.type === 'metrics';

const FeatureFlagsStateBridge = ({ client }: { client: UnleashClient }) => {
  const setServiceDegraded = useSetAtom(setServiceDegradedAtom);

  useEffect(() => {
    const notifyInitialFlags = () => {
      // The SDK loads stored toggles during initialization without emitting `update`.
      client.emit('update');
    };
    const markDegraded = (error?: unknown) => {
      if (isMetricsError(error)) {
        return;
      }
      setFeatureFlagsError(true);
      setServiceDegraded({ service: 'featureFlags', degraded: true });
    };
    const markHealthy = () => {
      setFeatureFlagsError(false);
      setServiceDegraded({ service: 'featureFlags', degraded: false });
    };

    client.on('initialized', notifyInitialFlags);
    client.on('error', markDegraded);
    client.on('ready', markHealthy);
    client.on('recovered', markHealthy);

    // The entitlements bootstrap may have started this client before these listeners existed.
    const startedEarly = isFeatureFlagsClientStarted(client);
    void startFeatureFlagsClient(client).then(() => {
      if (!startedEarly) {
        return;
      }
      notifyInitialFlags();
      const error = client.getError();
      if (error) {
        markDegraded(error);
      } else if (client.isReady()) {
        markHealthy();
      }
    }, markDegraded);

    return () => {
      client.off('initialized', notifyInitialFlags);
      client.off('error', markDegraded);
      client.off('ready', markHealthy);
      client.off('recovered', markHealthy);
      stopFeatureFlagsClient(client);
    };
  }, [client, setServiceDegraded]);

  return null;
};

const FeatureFlagsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useContext(ChromeAuthContext) as DeepRequired<ChromeAuthContextValue>;
  const isPreview = useAtomValue(isPreviewAtom);
  const orgId = user?.identity.internal?.org_id;
  const userId = user?.identity.internal?.account_id;
  const accountNumber = user?.identity.account_number;
  const email = user?.identity.user?.email;
  const hasUser = Boolean(user);
  const client = useMemo(() => {
    const unleashClient = getFeatureFlagsClient(user, isPreview);
    setUnleashClient(unleashClient);
    return unleashClient;
  }, [orgId, userId, accountNumber, email, hasUser, isPreview]);
  // FlagProvider retains its initial client in a ref; remount it for a new scoped context.
  const clientKey = useMemo(() => JSON.stringify(client.getContext()), [client]);

  return (
    <FlagProvider key={clientKey} unleashClient={client} startClient={false} stopClient={false}>
      <FeatureFlagsStateBridge client={client} />
      {children}
    </FlagProvider>
  );
};

export default FeatureFlagsProvider;

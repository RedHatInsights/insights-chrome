import React, { useContext, useEffect, useMemo } from 'react';
import { FlagProvider } from '@unleash/proxy-client-react';
import { DeepRequired } from 'utility-types';
import { useAtomValue } from 'jotai';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { setUnleashClient } from './unleashClient';
import { getFeatureFlagsClient, startFeatureFlagsClient, stopFeatureFlagsClient } from './featureFlagsClient';

const FeatureFlagsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useContext(ChromeAuthContext) as DeepRequired<ChromeAuthContextValue>;
  const isPreview = useAtomValue(isPreviewAtom);
  const client = useMemo(() => {
    const client = getFeatureFlagsClient(user, isPreview);
    setUnleashClient(client);
    return client;
  }, [user?.identity.internal?.org_id, user?.identity.internal?.account_id, user?.identity.account_number, user?.identity.user?.email, isPreview]);
  // FlagProvider retains its initial client in a ref; remount it for a new scoped context.
  const clientKey = useMemo(() => JSON.stringify(client.getContext()), [client]);
  useEffect(() => {
    void startFeatureFlagsClient(client).then(() => {
      // Bootstrap may have emitted these events before the provider's listeners mounted.
      client.emit('update');
      if (client.getError()) {
        client.emit('error', client.getError());
      }
    });
    return () => stopFeatureFlagsClient(client);
  }, [client]);
  return (
    <FlagProvider key={clientKey} unleashClient={client} startClient={false} stopClient={false}>
      {children}
    </FlagProvider>
  );
};

export default FeatureFlagsProvider;

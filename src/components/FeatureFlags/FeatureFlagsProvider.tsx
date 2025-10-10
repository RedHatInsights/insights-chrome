import React, { useContext, useMemo } from 'react';
import { FlagProvider, IFlagProvider, UnleashClient } from '@unleash/proxy-client-react';
import { DeepRequired } from 'utility-types';
import { captureException } from '@sentry/react';
import * as Sentry from '@sentry/react';
import { useAtomValue } from 'jotai';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { UNLEASH_ERROR_KEY, getUnleashClient, setUnleashClient } from './unleashClient';
import { getEnv } from '../../utils/common';

const config: IFlagProvider['config'] = {
  url: `${document.location.origin}/api/featureflags/v0`,
  clientKey: 'proxy-123',
  appName: 'web',
  headerName: 'X-Unleash-Auth',
  refreshInterval: 60000,
  metricsInterval: 120000,
  fetch: (url: URL, headers: RequestInit) => {
    /**
     * The default fetch handler in the client does not handle 500 errors and does not set the error flag or calls the on('error') listener.
     * So we need a little bit of cheating to unblock the flagError and flagsReady variables
     */
    return window
      .fetch(url, headers)
      .then((resp) => {
        // prevent the request from falling back to default error behavior
        //add warning level
        if (resp.status >= 400) {
          Sentry.captureMessage(`Feature loading error server error! ${resp.status}: ${resp.statusText}.`, 'warning');
          throw new Error(`Feature loading error server error! ${resp.status}: ${resp.statusText}.`);
        }

        const contentType = resp.headers.get('content-type');
        // make sure the response has correct content type
        // in case the API falls back to the chrome HTML template
        if (!contentType?.includes('application/json')) {
          throw new Error(`Feature loading error server error! Invalid response content type. Expected 'application/json, got: ${contentType}'`);
        }
        return resp;
      })
      .catch((err) => {
        captureException(err);
        // set the error flag
        localStorage.setItem(UNLEASH_ERROR_KEY, 'true');
        return {
          headers: {
            get: () => '',
          },
          json: () => Promise.resolve({ toggles: [] }),
          ok: true,
        };
      });
  },
};

const FeatureFlagsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useContext(ChromeAuthContext) as DeepRequired<ChromeAuthContextValue>;
  const isPreview = useAtomValue(isPreviewAtom);
  useMemo(() => {
    const client = new UnleashClient({
      ...config,
      context: {
        // the unleash context is not generic, look for issue/PR in the unleash repo or create one
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'platform.chrome.ui.preview': isPreview,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'platform.chrome.ui.env': getEnv(),
        userId: user?.identity.internal?.account_id,
        orgId: user?.identity.internal?.org_id,
        accountNumber: user?.identity.account_number,
        ...(user
          ? {
              properties: {
                account_number: user?.identity.account_number,
                email: user?.identity.user.email,
              },
            }
          : {}),
      },
    });
    setUnleashClient(client);
    return client;
  }, []);
  return <FlagProvider unleashClient={getUnleashClient()}>{children}</FlagProvider>;
};

export default FeatureFlagsProvider;

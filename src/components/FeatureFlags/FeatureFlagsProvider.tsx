import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import UnleasFlagProvider, { FlagProvider, IFlagProvider, UnleashClient } from '@unleash/proxy-client-react';
import { useSelector } from 'react-redux';
import { captureException } from '@sentry/react';
import { ReduxState } from '../../redux/store';
import { ChromeUser } from '@redhat-cloud-services/types';
import * as Sentry from '@sentry/react';

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

export const UNLEASH_ERROR_KEY = 'chrome:feature-flags:error';

/**
 * Clear error localstorage flag before initialization
 */
localStorage.setItem(UNLEASH_ERROR_KEY, 'false');

export let unleashClient: UnleashClient;
export const getFeatureFlagsError = () => localStorage.getItem(UNLEASH_ERROR_KEY) === 'true';

const FeatureFlagsProvider: React.FC = ({ children }) => {
  const user = useSelector<ReduxState, ChromeUser | undefined>((state) => state.chrome.user);
  const unleashClientInternal = useRef<UnleashClient>();

  // create the unleash client only after the user object is avaiable
  useEffect(() => {
    if (user && !unleashClientInternal.current) {
      unleashClientInternal.current = new UnleashClient({
        ...config,
        context: {
          properties: {
            account_number: user.identity.account_number,
          },
        },
      });
      unleashClient = unleashClientInternal.current;
      unleashClient.on('error', (error: any) => {
        console.log('error', error);
        localStorage.setItem(UNLEASH_ERROR_KEY, 'true');
      });
    }
  }, [user]);

  // fallback to render the chrome withouth the feature flags if the provider is not initialized properly
  if (getFeatureFlagsError() || !unleashClientInternal.current) {
    // Fallback to handle errored client. The default flags provides has silent error handling if the client fails to initialize
    return <FlagProvider config={config}>{children}</FlagProvider>;
  }

  return <UnleasFlagProvider unleashClient={unleashClientInternal.current}>{children}</UnleasFlagProvider>;
};

FeatureFlagsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default FeatureFlagsProvider;

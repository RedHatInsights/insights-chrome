import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import UnleasFlagProvider, { FlagProvider, UnleashClient } from '@unleash/proxy-client-react';
import { useSelector } from 'react-redux';
import { ReduxState } from '../../redux/store';
import { ChromeUser } from '@redhat-cloud-services/types';

const config = {
  url: `${document.location.origin}/api/featureflags/v0`,
  clientKey: 'proxy-123',
  appName: 'web',
  headerName: 'X-Unleash-Auth',
  refreshInterval: 60000,
  metrcisInterval: 120000,
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
      unleashClient.on('error', () => {
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

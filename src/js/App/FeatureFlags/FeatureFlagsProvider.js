import React from 'react';
import PropTypes from 'prop-types';
import UnleasFlagProvider, { UnleashClient } from '@unleash/proxy-client-react';

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
localStorage.setItem(UNLEASH_ERROR_KEY, false);

export const unleashClient = new UnleashClient(config);
export const getFeatureFlagsError = () => localStorage.getItem(UNLEASH_ERROR_KEY) === 'true';

unleashClient.on('error', () => {
  localStorage.setItem(UNLEASH_ERROR_KEY, true);
});

const FeatureFlagsProvider = ({ children }) => <UnleasFlagProvider unleashClient={unleashClient}>{children}</UnleasFlagProvider>;

FeatureFlagsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default FeatureFlagsProvider;

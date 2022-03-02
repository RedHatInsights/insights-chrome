import React from 'react';
import PropTypes from 'prop-types';
import UnleasFlagProvider from '@unleash/proxy-client-react';

const config = {
  url: `${document.location.origin}/api/featureflags/v0`,
  clientKey: 'proxy-123',
  appName: 'web',
  headerName: 'X-Unleash-Auth',
  refreshInterval: 60000,
  metrcisInterval: 120000,
};

const FeatureFlagsProvider = ({ children }) => <UnleasFlagProvider config={config}>{children}</UnleasFlagProvider>;

FeatureFlagsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default FeatureFlagsProvider;

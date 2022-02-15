import React from 'react';
import { Router } from 'react-router-dom';
import { isBeta } from '../../utils';
import chromeHistory from '../../utils/chromeHistory';
import { FeatureFlagsProvider } from '../FeatureFlags';
import IDPChecker from './IDPChecker';
import ScalprumRoot from './ScalprumRoot';

const RootApp = (props) => (
  <Router history={chromeHistory} basename={isBeta() ? '/beta' : '/'}>
    <FeatureFlagsProvider>
      <IDPChecker>
        {/* <CrossRequestNotifier /> */}
        <ScalprumRoot {...props} />
      </IDPChecker>
    </FeatureFlagsProvider>
  </Router>
);

export default RootApp;

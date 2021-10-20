import React from 'react';
import { Router } from 'react-router-dom';
import { isBeta } from '../../utils';
import chromeHistory from '../../utils/chromeHistory';
import CrossRequestNotifier from '../CrossRequestNotifier';
import IDPChecker from './IDPChecker';
import ScalprumRoot from './ScalprumRoot';

const RootApp = (props) => (
  <Router history={chromeHistory} basename={isBeta() ? '/beta' : '/'}>
    <IDPChecker>
      <CrossRequestNotifier />
      <ScalprumRoot {...props} />
    </IDPChecker>
  </Router>
);

export default RootApp;

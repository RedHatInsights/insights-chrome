import React from 'react';
import { Router } from 'react-router-dom';
import { isBeta } from '../../utils';
import chromeHistory from '../../utils/chromeHistory';
import CrossRequestNotifier from '../CrossRequestNotifier';
import ScalprumRoot from './ScalprumRoot';

const RootApp = (props) => (
  <Router history={chromeHistory} basename={isBeta() ? '/beta' : '/'}>
    <CrossRequestNotifier />
    <ScalprumRoot {...props} />
  </Router>
);

export default RootApp;

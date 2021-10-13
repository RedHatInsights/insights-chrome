import React from 'react';
import { Router } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isBeta } from '../../utils';
import chromeHistory from '../../utils/chromeHistory';
import CrossRequestNotifier from '../CrossRequestNotifier';
import ScalprumRoot from './ScalprumRoot';

const IDPChecker = ({ children }) => {
  const missingIDP = useSelector(({ chrome }) => chrome?.missingIDP);
  if (missingIDP === true) {
    return 'No IDP';
  }
  return children;
};

const RootApp = (props) => (
  <Router history={chromeHistory} basename={isBeta() ? '/beta' : '/'}>
    <IDPChecker>
      <CrossRequestNotifier />
      <ScalprumRoot {...props} />
    </IDPChecker>
  </Router>
);

export default RootApp;

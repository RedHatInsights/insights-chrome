import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { isBeta } from '../../utils';
import CrossRequestNotifier from '../CrossRequestNotifier';
import ScalprumRoot from './ScalprumRoot';

const RootApp = (props) => (
  <BrowserRouter basename={isBeta() ? '/beta' : '/'}>
    <CrossRequestNotifier />
    <ScalprumRoot {...props} />
  </BrowserRouter>
);

export default RootApp;

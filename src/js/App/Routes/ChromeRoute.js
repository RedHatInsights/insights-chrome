import { ScalprumComponent } from '@scalprum/react-core';
import React from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';
import LoadingFallback from '../../utils/loading-fallback';

const ChromeRoute = ({ scope, module, ...props }) => {
  return (
    <Route key={props.pathname} {...props}>
      <main role="main" className={scope}>
        <ScalprumComponent appName={scope} fallback={LoadingFallback} LoadingFallback={LoadingFallback} scope={scope} module={module} />
      </main>
    </Route>
  );
};

ChromeRoute.propTypes = {
  scope: PropTypes.string.isRequired,
  module: PropTypes.string.isRequired,
  pathname: PropTypes.string.isRequired,
};

export default ChromeRoute;

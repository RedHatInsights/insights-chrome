import { ScalprumComponent } from '@scalprum/react-core';
import React from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';
import LoadingFallback from '../../utils/loading-fallback';

const ChromeRoute = ({ scope, module, dynamic, ...props }) => {
  if (dynamic === false) {
    console.log('Render static app');
    return <div>There will be static application</div>;
  }
  return (
    <Route key={props.path} {...props}>
      <main role="main" className={scope}>
        <ScalprumComponent appName={scope} fallback={LoadingFallback} LoadingFallback={LoadingFallback} scope={scope} module={module} />
      </main>
    </Route>
  );
};

ChromeRoute.propTypes = {
  scope: PropTypes.string.isRequired,
  module: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  exact: PropTypes.bool,
  dynamic: PropTypes.bool,
};

export default ChromeRoute;

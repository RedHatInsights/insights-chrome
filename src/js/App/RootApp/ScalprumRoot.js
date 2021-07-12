import React, { lazy, Suspense } from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import DefaultLayout from './DefaultLayout';
import NavLoader from '../Sidenav/Navigation/Loader';

const Navigation = lazy(() => import('../Sidenav/Navigation'));
const LandingNav = lazy(() => import('../Sidenav/LandingNav'));

const loaderWrapper = (Component, props = {}) => (
  <Suspense fallback={<NavLoader />}>
    <Component {...props} />
  </Suspense>
);

const ScalprumRoot = ({ config, ...props }) => {
  const globalFilterRemoved = useSelector(({ globalFilter: { globalFilterRemoved } }) => globalFilterRemoved);
  return (
    /**
     * Once all applications are migrated to chrome 2:
     * - define chrome API in chrome root after it mounts
     * - copy these functions to window
     * - add deprecation warning to the window functions
     */
    <ScalprumProvider config={config} api={{ chrome: { experimentalApi: true, ...window.insights.chrome } }}>
      <Switch>
        <Route exact path="/">
          <DefaultLayout Sidebar={loaderWrapper(LandingNav)} {...props} globalFilterRemoved={globalFilterRemoved} />
        </Route>
        <Route path="/security">
          <DefaultLayout {...props} globalFilterRemoved={globalFilterRemoved} />
        </Route>
        <Route>
          <DefaultLayout Sidebar={loaderWrapper(Navigation)} {...props} globalFilterRemoved={globalFilterRemoved} />
        </Route>
      </Switch>
    </ScalprumProvider>
  );
};

ScalprumRoot.propTypes = {
  config: PropTypes.any,
};

export default ScalprumRoot;

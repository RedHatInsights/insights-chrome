import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useScalprum, ScalprumRoute, ScalprumLink } from '@scalprum/react-core';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import auth from '../auth';
import analytics from '../analytics';
import sentry from '../sentry';
import createChromeInstance from '../chrome/create-chrome';
import registerUrlObserver from '../url-observer';

const config = {
  advisor: {
    appId: 'advisor',
    elementId: 'advisor-root',
    name: 'advisor',
    rootLocation: '/foo',
    scriptLocation: `${window.location.origin}/apps/advisor/js/advisor.js`,
  },
  catalog: {
    appId: 'catalog',
    elementId: 'catalog-root',
    name: 'catalog',
    rootLocation: '/bar',
    scriptLocation: `${window.location.origin}/apps/catalog/js/catalog.js`,
  },
};

const RootApp = () => {
  const scalprum = useScalprum(config);
  const [insights, setInsights] = useState();
  useEffect(() => {
    const libjwt = auth();
    function noop() {}
    libjwt.initPromise.then(() => {
      libjwt.jwt
        .getUserInfo()
        .then((...data) => {
          analytics(...data);
          sentry(...data);
        })
        .catch(noop);
    });

    window.insights = window.insights || {};

    window.insights = createChromeInstance(libjwt, window.insights);
    const insights = window.insights;
    setInsights(insights);

    if (typeof _satellite !== 'undefined' && typeof window._satellite.pageBottom === 'function') {
      window._satellite.pageBottom();
      registerUrlObserver(window._satellite.pageBottom);
    }
  }, []);
  if (!scalprum.initialized || !insights) {
    return (
      <div>
        <h1>Loading</h1>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: 240, padding: 16 }}>
        <ul>
          <li>
            <ScalprumLink to="/">Home</ScalprumLink>
          </li>
          {Object.values(scalprum.config).map(({ appId, rootLocation }) => (
            <li key={appId}>
              <ScalprumLink to={rootLocation}>{appId}</ScalprumLink>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flexGrow: 1, padding: 16 }}>
        <Switch>
          {Object.values(scalprum.config).map(({ name, rootLocation, ...item }) => (
            <ScalprumRoute key={rootLocation} {...item} appName={name} path={rootLocation} />
          ))}
          <Route>
            <h1>Chrome home</h1>
          </Route>
        </Switch>
      </div>
    </div>
  );
};

RootApp.propTypes = {
  appId: PropTypes.string,
  activeApp: PropTypes.string,
  activeLocation: PropTypes.string,
  pageAction: PropTypes.string,
  pageObjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  globalFilterRemoved: PropTypes.bool,
};

function stateToProps({ chrome: { activeApp, activeLocation, appId, pageAction, pageObjectId }, globalFilter: { globalFilterRemoved } = {} }) {
  return { activeApp, activeLocation, appId, pageAction, pageObjectId, globalFilterRemoved };
}

const RootRouterWrapper = (props) => (
  <BrowserRouter basename="/insights/advisor">
    <RootApp {...props} />
  </BrowserRouter>
);

export default connect(stateToProps, null)(RootRouterWrapper);

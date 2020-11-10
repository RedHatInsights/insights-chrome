import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { safeLoad } from 'js-yaml';
import { connect } from 'react-redux';
import { useScalprum, ScalprumRoute, ScalprumLink } from '@scalprum/react-core';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import auth from '../auth';
import analytics from '../analytics';
import sentry from '../sentry';
import createChromeInstance from '../chrome/create-chrome';
import registerUrlObserver from '../url-observer';
import sourceOfTruth from '../nav/sourceOfTruth';

const RootApp = () => {
  const [insights, setInsights] = useState();
  const [config, setConfig] = useState();

  console.log('About to use Scalprum with this value:');
  console.log(config);
  let scalprum = useScalprum(config);
  console.log('Scalprum initialized:');
  console.log(scalprum);

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

    sourceOfTruth('testPrefix')
      .then((configYaml) => {
        let appConfig = safeLoad(configYaml);
        Object.entries(appConfig).forEach(([key, val]) => {
          val['scriptLocation'] = `${window.location.origin}${val['scriptLocation']}`;
        });
        console.log('Config is done:');
        console.log(appConfig);
        return appConfig;
      })
      .then((appConfig) => {
        console.log('Setting config:');
        console.log(appConfig);
        setConfig(appConfig);
      });

    if (typeof _satellite !== 'undefined' && typeof window._satellite.pageBottom === 'function') {
      window._satellite.pageBottom();
      registerUrlObserver(window._satellite.pageBottom);
    }
  }, []);
  if (!scalprum || !scalprum.initialized || !insights) {
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
  globalFilterHidden: PropTypes.bool,
};

function stateToProps({ chrome: { activeApp, activeLocation, appId, pageAction, pageObjectId }, globalFilter: { globalFilterHidden } = {} }) {
  return { activeApp, activeLocation, appId, pageAction, pageObjectId, globalFilterHidden };
}

const RootRouterWrapper = (props) => (
  <BrowserRouter basename="/insights/advisor">
    <RootApp {...props} />
  </BrowserRouter>
);

export default connect(stateToProps, null)(RootRouterWrapper);

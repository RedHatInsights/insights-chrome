import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useScalprum } from '@scalprum/react-core';
import { BrowserRouter, Link, Route, Switch } from 'nice-router'; // need some alias because of inventory
import auth from '../auth';
import analytics from '../analytics';
import sentry from '../sentry';
import createChromeInstance from '../chrome/create-chrome';
import registerUrlObserver from '../url-observer';
import { getApp, getAppsByRootLocation, injectScript } from '@scalprum/core';

/**
 * Scalplet route mock. This is required because of inventory router external dependency name.
 * That is not renamed and causes router to be undefined in scalplet route.
 */

// eslint-disable-next-line react/prop-types
const ScalpletRoute = ({ setCurrentApp, Placeholder = Fragment, elementId, appName, path, ...props }) => {
  const { scriptLocation } = getAppsByRootLocation(path)?.[0];
  useEffect(() => {
    const app = getApp(appName);

    if (!app) {
      injectScript(appName, scriptLocation).then((...args) => {
        const app = getApp(appName);
        console.log({ args, appName, app });
        app.mount();
        setCurrentApp(app);
      });
    } else {
      app.mount();
      setCurrentApp(app);
    }
  }, [path]);

  return (
    <Route {...props} path={path}>
      <div id={elementId}>
        <Placeholder />
      </div>
    </Route>
  );
};

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

console.log(window.location.origin);

// eslint-disable-next-line react/prop-types
const SmartLink = ({ setCurrentApp, unmount, ...props }) => {
  return (
    <Link
      onClick={() => {
        if (unmount) {
          unmount();
          setCurrentApp();
        }
      }}
      {...props}
    />
  );
};

const RootApp = () => {
  const scalprum = useScalprum(config);
  const [insights, setInsights] = useState();
  /**
   * We will need to add this routine to the scalprum core.
   * React 17 async rendering will destroy app root before the clean up phase of scalprum route gest invoked and app is not unmounted
   * We will prbably need different mechanism that the scalplet route.
   * we might need to handle the mount/unmount/update logic outside of the scalplet and inside of the scaffolding instead
   */
  const [currentApp, setCurrentApp] = useState();
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
            <SmartLink setCurrentApp={setCurrentApp} unmount={currentApp?.unmount} to="/">
              Home
            </SmartLink>
          </li>
          {Object.values(scalprum.config).map(({ appId, rootLocation }) => (
            <li key={appId}>
              <SmartLink setCurrentApp={setCurrentApp} unmount={currentApp?.unmount} to={rootLocation}>
                {appId}
              </SmartLink>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flexGrow: 1, padding: 16 }}>
        <Switch>
          {Object.values(scalprum.config).map(({ name, rootLocation, ...item }) => (
            <ScalpletRoute setCurrentApp={setCurrentApp} key={rootLocation} {...item} appName={name} path={rootLocation} />
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

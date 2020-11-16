import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useScalprum, ScalprumRoute } from '@scalprum/react-core';
import { BrowserRouter, Link, Route, Switch } from 'react-router-dom';
import auth from '../auth';
import analytics from '../analytics';
import sentry from '../sentry';
import createChromeInstance from '../chrome/create-chrome';
import registerUrlObserver from '../url-observer';
import { HeaderLoader } from './Header';
import { Nav, NavItem, NavList, Page, PageSidebar } from '@patternfly/react-core';

const RootApp = ({ config }) => {
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
    <Page
      className="pf-m-redhat-font ins-chrome-content"
      header={<HeaderLoader />}
      sidebar={
        <PageSidebar
          id="ins-c-sidebar"
          className="ins-c-sidebar"
          nav={
            <Nav>
              <NavList>
                <NavItem to="/" component={({ href, ...props }) => <Link to={href} {...props} />}>
                  Home
                </NavItem>
                {Object.values(scalprum.config).map(({ appId, rootLocation }) => (
                  <NavItem key={appId} to={rootLocation} component={({ href, ...props }) => <Link to={href} {...props} />}>
                    {appId}
                  </NavItem>
                ))}
              </NavList>
            </Nav>
          }
        />
      }
    >
      <div className="pf-c-page__drawer" style={{ flexGrow: 1, padding: 16 }}>
        <div className="pf-c-drawer__content">
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
    </Page>
  );
};

RootApp.propTypes = {
  appId: PropTypes.string,
  activeApp: PropTypes.string,
  activeLocation: PropTypes.string,
  pageAction: PropTypes.string,
  pageObjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  globalFilterHidden: PropTypes.bool,
  config: PropTypes.any,
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

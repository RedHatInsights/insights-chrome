import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import GlobalFilter from './GlobalFilter/GlobalFilter';
import { useScalprum, ScalprumComponent } from '@scalprum/react-core';
import { Bullseye, Page, PageHeader, PageSidebar, Spinner } from '@patternfly/react-core';
import SideNav from './Sidenav/SideNav';
import Header from './Header/Header';
import ErrorBoundary from './ErrorBoundary';

const RootApp = ({ activeApp, activeLocation, appId, config, pageAction, pageObjectId, globalFilterHidden }) => {
  const isGlobalFilterEnabled =
    (!globalFilterHidden && activeLocation === 'insights') || Boolean(localStorage.getItem('chrome:experimental:global-filter'));
  const scalprum = useScalprum(config);
  return (
    <Fragment>
      <div
        className="pf-c-drawer__content"
        data-ouia-subnav={activeApp}
        data-ouia-bundle={activeLocation}
        data-ouia-app-id={appId}
        data-ouia-safe="true"
        {...(pageAction && { 'data-ouia-page-type': pageAction })}
        {...(pageObjectId && { 'data-ouia-page-object-id': pageObjectId })}
      >
        <Page header={<PageHeader headerTools={<Header />} />} sidebar={<PageSidebar id="ins-c-sidebar" nav={<SideNav />} isNavOpen />}>
          <div className={isGlobalFilterEnabled ? '' : 'ins-m-full--height'}>
            {isGlobalFilterEnabled && <GlobalFilter />}
            <main id="root" role="main">
              {scalprum.initialized ? (
                <ErrorBoundary>
                  <ScalprumComponent appName="advisor" module="./RootApp" scope="advisor" />
                </ErrorBoundary>
              ) : (
                <Bullseye>
                  <Spinner size="xl" />
                </Bullseye>
              )}
            </main>
            <main className="pf-c-page__main" id="no-access"></main>
          </div>
        </Page>
      </div>
    </Fragment>
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

function stateToProps({ chrome: { activeApp, activeLocation, appId, pageAction, pageObjectId }, globalFilter: { globalFilterRemoved } = {} }) {
  return { activeApp, activeLocation, appId, pageAction, pageObjectId, globalFilterRemoved };
}
export default connect(stateToProps, null)(RootApp);

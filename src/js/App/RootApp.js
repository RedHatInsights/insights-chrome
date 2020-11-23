import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import GlobalFilter from './GlobalFilter/GlobalFilter';
import { useScalprum, ScalprumComponent } from '@scalprum/react-core';

const RootApp = ({ activeApp, activeLocation, appId, config, pageAction, pageObjectId, globalFilterHidden }) => {
  const isGlobalFilterEnabled =
    (!globalFilterHidden && activeLocation === 'insights') || Boolean(localStorage.getItem('chrome:experimental:global-filter'));
  const scalprum = useScalprum(config);
  console.log(scalprum, '<<< scalprum');
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
        <div className={isGlobalFilterEnabled ? '' : 'ins-m-full--height'}>
          {isGlobalFilterEnabled && <GlobalFilter />}
          <main className="pf-c-page__main pf-l-page__main" id="root" role="main">
            {scalprum.initialized && (
              <ScalprumComponent
                rootLocation={config.advisor.rootLocation}
                path="/foo"
                manifestLocation={config.advisor.manifestLocation}
                appName="advisor"
                module="./RootApp"
                scope="advisor"
              />
            )}
          </main>
          <main className="pf-c-page__main" id="no-access"></main>
        </div>
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

function stateToProps({ chrome: { activeApp, activeLocation, appId, pageAction, pageObjectId }, globalFilter: { globalFilterHidden } = {} }) {
  return { activeApp, activeLocation, appId, pageAction, pageObjectId, globalFilterHidden };
}
export default connect(stateToProps, null)(RootApp);

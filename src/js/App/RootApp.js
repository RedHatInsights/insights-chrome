import React, { Fragment, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import GlobalFilter from './GlobalFilter/GlobalFilter';

const Advisor = lazy(() => import('advisor/RootApp'));

const RootApp = ({ activeApp, activeLocation, appId, pageAction, pageObjectId, globalFilterHidden }) => {
  const isGlobalFilterEnabled =
    (!globalFilterHidden && activeLocation === 'insights') || Boolean(localStorage.getItem('chrome:experimental:global-filter'));
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
            {/* Only render advisor for now, until full integration is finished */}
            <Suspense fallback={<div>Loading advisor</div>}>
              <Advisor />
            </Suspense>
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

function stateToProps({ chrome: { activeApp, activeLocation, appId, pageAction, pageObjectId }, globalFilter: { globalFilterRemoved } = {} }) {
  return { activeApp, activeLocation, appId, pageAction, pageObjectId, globalFilterRemoved };
}
export default connect(stateToProps, null)(RootApp);

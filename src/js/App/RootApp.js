import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';
import GlobalFilter from './GlobalFilter/GlobalFilter';
import { useScalprum, ScalprumComponent } from '@scalprum/react-core';
import { Bullseye, Page, PageHeader, PageSidebar, Spinner } from '@patternfly/react-core';
import { BrowserRouter } from 'react-router-dom';
import SideNav from './Sidenav/SideNav';
import Header from './Header/Header';
import ErrorBoundary from './ErrorBoundary';

const RootApp = ({ activeApp, activeLocation, appId, config, pageAction, pageObjectId, globalFilterHidden }) => {
  const isGlobalFilterEnabled =
    (!globalFilterHidden && activeLocation === 'insights') || Boolean(localStorage.getItem('chrome:experimental:global-filter'));
  const scalprum = useScalprum(config);
  const remoteModule = useSelector(({ chrome }) => chrome?.activeSection?.module);
  const insightsContentRef = useRef(null);
  useEffect(() => {
    const contentElement = document.getElementById('root');
    if (!remoteModule) {
      insightsContentRef.current.appendChild(contentElement);
      contentElement.hidden = false;
      contentElement.style.display = 'initial';
    } else {
      contentElement.hidden = true;
      try {
        insightsContentRef.current.removeChild(contentElement);
      } catch (error) {
        /**
         * legacy content element is not a child of chrome content
         */
      }
    }
  }, [remoteModule]);
  return (
    <BrowserRouter>
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
          <div ref={insightsContentRef} className={isGlobalFilterEnabled ? '' : 'ins-m-full--height'}>
            {isGlobalFilterEnabled && <GlobalFilter />}
            {remoteModule && (
              <main role="main">
                {typeof remoteModule !== 'undefined' && scalprum.initialized ? (
                  <ErrorBoundary>
                    {/* Slcaprum component does not react on config changes. Hack it with key to force new instance until that is enabled. */}
                    <ScalprumComponent key={remoteModule.appName} {...remoteModule} />
                  </ErrorBoundary>
                ) : (
                  <Bullseye className="pf-u-p-xl">
                    <Spinner size="xl" />
                  </Bullseye>
                )}
              </main>
            )}
            <main className="pf-c-page__main" id="no-access"></main>
          </div>
        </Page>
      </div>
    </BrowserRouter>
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

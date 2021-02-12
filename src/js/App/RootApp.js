import React, { memo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect, shallowEqual, useSelector } from 'react-redux';
import GlobalFilter from './GlobalFilter/GlobalFilter';
import { useScalprum, ScalprumComponent } from '@scalprum/react-core';
import { Bullseye, Page, PageHeader, PageSidebar, Spinner } from '@patternfly/react-core';
import { BrowserRouter } from 'react-router-dom';
import SideNav from './Sidenav/SideNav';
import { Header, HeaderTools } from './Header/Header';
import ErrorBoundary from './ErrorBoundary';
import { getEnv, isBeta } from '../utils';
import LandingNav from './Sidenav/LandingNav';
import isEqual from 'lodash/isEqual';

const LoadingComponent = () => (
  <Bullseye className="pf-u-p-xl">
    <Spinner size="xl" />
  </Bullseye>
);

const isModule = (key, chrome) =>
  key === (chrome?.activeSection?.id || chrome?.activeLocation) ||
  (key !== undefined && chrome?.activeSection?.group !== undefined && key === chrome?.activeSection?.group);

const ShieldedRoot = memo(
  ({ useLandingNav, hideNav, insightsContentRef, isGlobalFilterEnabled, initialized, remoteModule, appId }) => (
    <Page
      isManagedSidebar={!hideNav}
      header={<PageHeader logoProps={{ href: './' }} logo={<Header />} showNavToggle={!hideNav} headerTools={<HeaderTools />} />}
      sidebar={hideNav ? undefined : <PageSidebar id="ins-c-sidebar" nav={useLandingNav ? <LandingNav /> : <SideNav />} />}
    >
      <div ref={insightsContentRef} className={isGlobalFilterEnabled ? '' : 'ins-m-full--height'}>
        {isGlobalFilterEnabled && <GlobalFilter />}
        {remoteModule && (
          <main role="main" className={appId}>
            {typeof remoteModule !== 'undefined' && initialized ? (
              <ErrorBoundary>
                {/* Slcaprum component does not react on config changes. Hack it with key to force new instance until that is enabled. */}
                <ScalprumComponent fallback={<LoadingComponent />} LoadingComponent={LoadingComponent} key={remoteModule.appName} {...remoteModule} />
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
  ),
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);

ShieldedRoot.propTypes = {
  useLandingNav: PropTypes.bool,
  hideNav: PropTypes.bool,
  insightsContentRef: PropTypes.object.isRequired,
  isGlobalFilterEnabled: PropTypes.bool.isRequired,
  initialized: PropTypes.bool,
  remoteModule: PropTypes.shape({
    appName: PropTypes.string.isRequired,
  }),
  appId: PropTypes.string,
};
ShieldedRoot.defaultProps = {
  useLandingNav: false,
  hideNav: false,
  isGlobalFilterEnabled: false,
  initialized: false,
};
ShieldedRoot.displayName = 'ShieldedRoot';

const RootApp = ({ activeApp, activeLocation, appId, config, pageAction, pageObjectId, globalFilterHidden }) => {
  const scalprum = useScalprum(config);
  const hideNav = useSelector(({ chrome: { user } }) => !user);
  const remoteModule = useSelector(({ chrome }) => {
    const activeModule = chrome?.modules?.reduce((app, curr) => {
      const [currKey] = Object.keys(curr);
      if (isModule(currKey, chrome) || isModule(curr?.[currKey]?.module?.group, chrome)) {
        app = curr[currKey];
      }
      return app;
    }, undefined);
    if (activeModule) {
      const appName = activeModule?.module?.appName || chrome?.activeSection?.id || chrome?.activeLocation;
      const [scope, module] = activeModule?.module?.split?.('#') || [];
      return {
        module: module || activeModule?.module?.module,
        scope: scope || activeModule?.module?.scope,
        appName,
      };
    }
  }, shallowEqual);
  const isLanding = useSelector(({ chrome }) => chrome?.appId === 'landing');
  const isGlobalFilterEnabled =
    !isLanding && ((!globalFilterHidden && activeLocation === 'insights') || Boolean(localStorage.getItem('chrome:experimental:global-filter')));
  const insightsContentRef = useRef(null);
  useEffect(() => {
    const contentElement = document.getElementById('root');
    if (!remoteModule) {
      if (contentElement) {
        insightsContentRef.current.appendChild(contentElement);
        contentElement.hidden = false;
        contentElement.style.display = 'initial';
      }
    } else {
      try {
        contentElement.hidden = true;
        insightsContentRef.current.removeChild(contentElement);
      } catch (error) {
        /**
         * legacy content element is not a child of chrome content
         */
      }
    }
  }, [remoteModule]);
  const useLandingNav = isLanding && isBeta() && getEnv() === 'ci';
  return (
    <BrowserRouter basename={isBeta() ? '/beta' : '/'}>
      <div
        className="pf-c-drawer__content"
        data-ouia-subnav={activeApp}
        data-ouia-bundle={activeLocation}
        data-ouia-app-id={appId}
        data-ouia-safe="true"
        {...(pageAction && { 'data-ouia-page-type': pageAction })}
        {...(pageObjectId && { 'data-ouia-page-object-id': pageObjectId })}
      >
        <ShieldedRoot
          isGlobalFilterEnabled={isGlobalFilterEnabled}
          hideNav={hideNav}
          insightsContentRef={insightsContentRef}
          useLandingNav={useLandingNav}
          initialized={scalprum.initialized}
          remoteModule={remoteModule}
          appId={appId}
        />
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

function stateToProps({ chrome: { activeApp, activeLocation, appId, pageAction, pageObjectId }, globalFilter: { globalFilterRemoved } = {} }) {
  return { activeApp, activeLocation, appId, pageAction, pageObjectId, globalFilterRemoved };
}
export default connect(stateToProps, null)(RootApp);

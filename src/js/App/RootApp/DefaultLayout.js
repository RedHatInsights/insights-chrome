import React, { memo, useEffect, useRef } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import GlobalFilter from '../GlobalFilter/GlobalFilter';
import { useScalprum } from '@scalprum/react-core';
import { Button, Masthead, MastheadToggle, Page, PageSidebar } from '@patternfly/react-core';
import { useLocation } from 'react-router-dom';
import { Header } from '../Header/Header';
import Cookie from 'js-cookie';
import isEqual from 'lodash/isEqual';
import { onToggle } from '../../redux/actions';
import Routes from '../Routes';
import useOuiaTags from '../../utils/useOuiaTags';
import BarsIcon from '@patternfly/react-icons/dist/js/icons/bars-icon';

import '../Sidenav/Navigation/Navigation.scss';
import './DefaultLayout.scss';
import { CROSS_ACCESS_ACCOUNT_NUMBER } from '../../consts';

const ShieldedRoot = memo(
  ({ hideNav, insightsContentRef, isGlobalFilterEnabled, initialized, Sidebar }) => {
    const dispatch = useDispatch();
    useEffect(() => {
      const navToggleElement = document.querySelector('button#nav-toggle');
      if (navToggleElement) {
        navToggleElement.onclick = () => dispatch(onToggle());
      }
    }, []);

    if (!initialized) {
      return null;
    }

    const selectedAccountNumber = Cookie.get(CROSS_ACCESS_ACCOUNT_NUMBER);
    const hasBanner = false; // Update this later when we use feature flags

    return (
      <Page
        isManagedSidebar={!hideNav}
        className={classnames({ 'ins-c-page__hasBanner': hasBanner, 'ins-c-page__account-banner': selectedAccountNumber })}
        header={
          <Masthead className="chr-c-masthead">
            <MastheadToggle>
              <Button variant="plain" onClick={() => {}} aria-label="Global navigation">
                <BarsIcon />
              </Button>
            </MastheadToggle>
            {<Header />}
          </Masthead>
        }
        sidebar={hideNav ? undefined : <PageSidebar id="ins-c-sidebar" nav={Sidebar} />}
      >
        <div ref={insightsContentRef} className={classnames('ins-c-render', { 'ins-m-full--height': !isGlobalFilterEnabled })}>
          {isGlobalFilterEnabled && <GlobalFilter />}
          {selectedAccountNumber && <div className="ins-c-viewing-as">Viewing as Account {selectedAccountNumber}</div>}
          <Routes insightsContentRef={insightsContentRef} />
          <main className="pf-c-page__main" id="no-access"></main>
        </div>
      </Page>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);

ShieldedRoot.propTypes = {
  hideNav: PropTypes.bool,
  insightsContentRef: PropTypes.object.isRequired,
  isGlobalFilterEnabled: PropTypes.bool.isRequired,
  initialized: PropTypes.bool,
  Sidebar: PropTypes.element,
};
ShieldedRoot.defaultProps = {
  useLandingNav: false,
  hideNav: false,
  isGlobalFilterEnabled: false,
  initialized: false,
};
ShieldedRoot.displayName = 'ShieldedRoot';

const RootApp = ({ globalFilterHidden, Sidebar }) => {
  const ouiaTags = useOuiaTags();
  const initialized = useScalprum(({ initialized }) => initialized);
  const { pathname } = useLocation();
  const hideNav = useSelector(({ chrome: { user } }) => !user || !Sidebar);
  const activeLocation = pathname.split('/')[1];
  /**
   * Using the chrome landing flag is not going to work because the appId is initialized inside the app.
   * We need the information before anything is rendered to determine if we use root module or render landing page.
   * This will be replaced once we can use react router for all pages. Landing page will have its own route.
   */
  const isLanding = pathname === '/';

  const isGlobalFilterEnabled =
    !isLanding && ((!globalFilterHidden && activeLocation === 'insights') || Boolean(localStorage.getItem('chrome:experimental:global-filter')));
  const insightsContentRef = useRef(null);

  return (
    <div id="chrome-app-render-root" className="pf-c-drawer__content" {...ouiaTags}>
      <ShieldedRoot
        isGlobalFilterEnabled={isGlobalFilterEnabled}
        hideNav={hideNav}
        insightsContentRef={insightsContentRef}
        initialized={initialized}
        Sidebar={Sidebar}
      />
    </div>
  );
};

RootApp.propTypes = {
  activeApp: PropTypes.string,
  pageAction: PropTypes.string,
  pageObjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  globalFilterHidden: PropTypes.bool,
  config: PropTypes.any,
  Sidebar: PropTypes.element,
};

export default RootApp;

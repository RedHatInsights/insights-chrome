import React, { memo, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import GlobalFilter from '../js/App/GlobalFilter/GlobalFilter';
import { useScalprum } from '@scalprum/react-core';
import { Masthead, MastheadToggle, Page, PageSidebar, PageToggleButton } from '@patternfly/react-core';
import { useLocation } from 'react-router-dom';
import { Header } from '../js/App/Header/Header';
import Cookie from 'js-cookie';
import isEqual from 'lodash/isEqual';
import { onToggle } from '../redux/actions';
import Routes from '../js/App/Routes';
import useOuiaTags from '../utils/useOuiaTags';
import RedirectBanner from '../js/App/Stratosphere/RedirectBanner';
import BarsIcon from '@patternfly/react-icons/dist/js/icons/bars-icon';
import { useIntl } from 'react-intl';
import messages from '../locales/Messages';
import { CROSS_ACCESS_ACCOUNT_NUMBER } from '../utils/consts';
import { getUrl } from '../utils/common';

import '../js/App/Sidenav/Navigation/Navigation.scss';
import './DefaultLayout.scss';

const ShieldedRoot = memo(
  ({ hideNav, insightsContentRef, isGlobalFilterEnabled, initialized, Sidebar }) => {
    const dispatch = useDispatch();
    const [isMobileView, setIsMobileView] = useState(window.document.body.clientWidth < 1200);
    const [isNavOpen, setIsNavOpen] = useState(!isMobileView);
    /**
     * Required for event listener to access the variables
     */
    const mutableStateRef = useRef({
      isMobileView,
    });
    function navReziseListener() {
      const internalMobile = window.document.body.clientWidth < 1200;
      const { isMobileView } = mutableStateRef.current;
      if (!isMobileView && internalMobile) {
        setIsMobileView(true);
        setIsNavOpen(false);
        mutableStateRef.current = {
          isMobileView: true,
        };
      } else if (isMobileView && !internalMobile) {
        setIsMobileView(false);
        setIsNavOpen(true);
        mutableStateRef.current = {
          isMobileView: false,
        };
      }
    }

    const intl = useIntl();

    useEffect(() => {
      window.addEventListener('resize', navReziseListener);
      return () => {
        window.removeEventListener('resize', navReziseListener);
      };
    }, []);

    if (!initialized) {
      return null;
    }

    const selectedAccountNumber = Cookie.get(CROSS_ACCESS_ACCOUNT_NUMBER);
    const hasBanner = false; // Update this later when we use feature flags

    return (
      <Page
        className={classnames({ 'chr-c-page__hasBanner': hasBanner, 'chr-c-page__account-banner': selectedAccountNumber })}
        onPageResize={null} // required to disable PF resize observer that causes re-rendring issue
        header={
          <Masthead className="chr-c-masthead">
            {!hideNav && (
              <MastheadToggle>
                <PageToggleButton
                  variant="plain"
                  aria-label="Global navigation"
                  isNavOpen={isNavOpen}
                  onNavToggle={() => {
                    setIsNavOpen((prev) => !prev);
                    dispatch(onToggle());
                  }}
                >
                  <BarsIcon />
                </PageToggleButton>
              </MastheadToggle>
            )}
            <Header />
          </Masthead>
        }
        sidebar={hideNav ? undefined : <PageSidebar isNavOpen={isNavOpen} id="chr-c-sidebar" nav={Sidebar} />}
      >
        <div ref={insightsContentRef} className={classnames('chr-render')}>
          {isGlobalFilterEnabled && <GlobalFilter key={getUrl('bundle')} />}
          {selectedAccountNumber && <div className="chr-viewing-as">{intl.formatMessage(messages.viewingAsAccount, { selectedAccountNumber })}</div>}
          <RedirectBanner />
          <Routes routesProps={{ scopeClass: 'chr-scope__default-layout' }} insightsContentRef={insightsContentRef} />
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

const isGlobalFilterAllowed = () => {
  if (getUrl('bundle') === 'insights') {
    return true;
  }

  return getUrl('bundle') === 'ansible' && ['inventory', 'drift', 'advisor'].includes(getUrl('app'));
};

const RootApp = ({ globalFilterHidden, Sidebar }) => {
  const ouiaTags = useOuiaTags();
  const initialized = useScalprum(({ initialized }) => initialized);
  const { pathname } = useLocation();
  const hideNav = useSelector(({ chrome: { user } }) => !user || !Sidebar);

  /**
   * Using the chrome landing flag is not going to work because the appId is initialized inside the app.
   * We need the information before anything is rendered to determine if we use root module or render landing page.
   * This will be replaced once we can use react router for all pages. Landing page will have its own route.
   */
  const isLanding = pathname === '/';

  const globalFilterAllowed = !globalFilterHidden && isGlobalFilterAllowed();

  const isGlobalFilterEnabled = !isLanding && (globalFilterAllowed || Boolean(localStorage.getItem('chrome:experimental:global-filter')));
  const insightsContentRef = useRef(null);

  return (
    <div id="chrome-app-render-root" {...ouiaTags}>
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

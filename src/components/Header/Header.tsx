import React, { Fragment, Suspense, memo, useContext, useState } from 'react';
import ReactDOM from 'react-dom';
import { useFlag } from '@unleash/proxy-client-react';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import { MastheadBrand, MastheadContent, MastheadLogo, MastheadMain } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import MastheadMenuToggle from '../Header/MastheadMenuToggle';
import ContextSwitcher from '../ContextSwitcher';
import Feedback from '../Feedback';
import Activation from '../Activation';
import Logo from './Logo';
import ChromeLink from '../ChromeLink';
import { Route, Routes } from 'react-router-dom';
import { DeepRequired } from 'utility-types';

import './Header.scss';
import { activationRequestURLs } from '../../utils/consts';
import SearchInput from '../Search/SearchInput';
import AllServicesDropdown from '../AllServicesDropdown/AllServicesDropdown';
import { Breadcrumbsprops } from '../Breadcrumbs/Breadcrumbs';
import useWindowWidth from '../../hooks/useWindowWidth';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';

const FeedbackRoute = () => {
  // controls feedback tab visibility
  const paths =
    localStorage.getItem('chrome:experimental:feedback') === 'true'
      ? ['*']
      : ['/', 'insights/*', 'settings/*', 'openshift/*', 'application-services/*', 'ansible/*', 'subscriptions/*', 'iam/*'];
  return (
    <Routes>
      {paths.map((path) => (
        <Route key={path} path={path} element={<Feedback />} />
      ))}
    </Routes>
  );
};

function hasUser(user: { orgId?: string; username?: string; accountNumber?: string; email?: string }): user is Required<typeof user> {
  return !!(user.orgId && user.username && user.accountNumber && user.email);
}

const MemoizedHeader = memo(
  ({
    breadcrumbsProps,
    orgId,
    username,
    accountNumber,
    email,
    isInternal = false,
  }: {
    breadcrumbsProps?: Breadcrumbsprops;
    orgId: string;
    username: string;
    accountNumber: string;
    email: string;
    isInternal?: boolean;
  }) => {
    const search = new URLSearchParams(window.location.search).keys().next().value ?? '';
    const isActivationPath = activationRequestURLs.includes(search);
    const { md } = useWindowWidth();
    const [searchOpen, setSearchOpen] = useState(false);
    const hideAllServices = (isOpen: boolean) => {
      setSearchOpen(isOpen);
    };
    const isITLess = useFlag('platform.chrome.itless');

    const userReady = hasUser({ orgId, username, accountNumber, email });

    const { hideNav, isNavOpen, setIsNavOpen } = breadcrumbsProps || {};

    const rootElementClasses = Array.from(document?.documentElement?.classList);
    const theme = rootElementClasses.includes('pf-v6-theme-dark') ? 'dark' : 'light';

    return (
      <Fragment>
        <MastheadMain>
          {!hideNav && <MastheadMenuToggle setIsNavOpen={setIsNavOpen} isNavOpen={isNavOpen} />}
          <MastheadBrand data-codemods>
            <MastheadLogo
              data-codemods
              className="chr-c-masthead__logo pf-v6-u-pr-0 pf-v6-u-pl-sm"
              component={(props) => <ChromeLink {...props} appId="landing" href="/" />}
            >
              <Logo theme={theme} />
            </MastheadLogo>
            {!(!md && searchOpen) && <AllServicesDropdown />}
          </MastheadBrand>
        </MastheadMain>
        <MastheadContent className="pf-v6-u-mx-0">
          {orgId && !isITLess && ReactDOM.createPortal(<FeedbackRoute />, document.body)}
          {userReady && isActivationPath && (
            <Activation
              user={{
                username,
                accountNumber,
                email,
              }}
              request={search}
            />
          )}
          <Toolbar isFullHeight>
            <ToolbarContent>
              <ToolbarGroup variant="filter-group">
                {userReady && !isITLess && (
                  <ToolbarItem className="pf-v6-m-hidden pf-v6-m-visible-on-xl">
                    <ContextSwitcher accountNumber={accountNumber} isInternal={isInternal} className="data-hj-suppress sentry-mask" />
                  </ToolbarItem>
                )}
              </ToolbarGroup>
              <ToolbarGroup className="pf-v6-u-flex-grow-1" variant="filter-group" gap={{ default: 'gapNone' }}>
                <ToolbarGroup className="pf-v6-u-flex-grow-1 pf-v6-u-mr-sm pf-v6-u-ml-4xl-on-2xl" variant="filter-group">
                  <Suspense fallback={null}>
                    <SearchInput onStateChange={hideAllServices} />
                  </Suspense>
                </ToolbarGroup>
                <ToolbarGroup className="pf-v6-m-icon-button-group pf-v6-u-ml-auto pf-v6-u-mr-0" widget-type="InsightsToolbar" gap={{ default: 'gapSm' }}>
                  <HeaderTools />
                </ToolbarGroup>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      </Fragment>
    );
  }
);

MemoizedHeader.displayName = 'MemoizedHeader';

export const Header = ({ breadcrumbsProps }: { breadcrumbsProps?: Breadcrumbsprops }) => {
  // extract valid data from the context
  // we don't want to use the context directly to prevent unnecessary re-renders
  const { user } = useContext(ChromeAuthContext) as DeepRequired<ChromeAuthContextValue>;
  return (
    <MemoizedHeader
      username={user.identity.user.username}
      accountNumber={user.identity.account_number}
      email={user.identity.user.email}
      orgId={user.identity.org_id}
      isInternal={user.identity.user.is_internal}
      breadcrumbsProps={breadcrumbsProps}
    />
  );
};

export const HeaderTools = () => {
  const { ready } = useContext(ChromeAuthContext);
  if (!ready) {
    return <UnAuthtedHeader />;
  }
  return <Tools />;
};

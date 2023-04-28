import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import { MastheadBrand, MastheadContent, MastheadMain, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import ServicesLink from './ServicesLink';
import FavoritesLink from './FavoritesLink';
import SatelliteLink from './SatelliteLink';
import ContextSwitcher from '../ContextSwitcher';
import Feedback from '../Feedback';
import Activation from '../Activation';
import { useSelector } from 'react-redux';
import Logo from './Logo';
import ChromeLink from '../ChromeLink';
import { Route, Routes } from 'react-router-dom';
import { ChromeUser } from '@redhat-cloud-services/types';
import { DeepRequired } from 'utility-types';

import './Header.scss';
import { ReduxState } from '../../redux/store';
import { activationRequestURLs } from '../../utils/consts';
import { ITLess } from '../../utils/common';
import SearchInput from '../Search/SearchInput';
import AllServicesDropdown from '../AllServicesDropdown/AllServicesDropdown';
import { useFlag } from '@unleash/proxy-client-react';
import Breadcrumbs, { Breadcrumbsprops } from '../Breadcrumbs/Breadcrumbs';
import useEnableBreadcrumbs from '../../hooks/useEnableBreadcrumbs';

const FeedbackRoute = ({ user }: { user: DeepRequired<ChromeUser> }) => {
  const paths =
    localStorage.getItem('chrome:experimental:feedback') === 'true'
      ? ['*']
      : ['insights/*', 'settings/*', 'openshift/*', 'application-services/*', 'ansible/*', 'edge/*'];
  return (
    <Routes>
      {paths.map((path) => (
        <Route key={path} path={path} element={<Feedback user={user} />} />
      ))}
    </Routes>
  );
};

export const Header = ({ breadcrumbsProps }: { breadcrumbsProps?: Breadcrumbsprops }) => {
  const searchEnabled = useFlag('platform.chrome.search.enabled');
  const user = useSelector(({ chrome }: DeepRequired<ReduxState>) => chrome.user);
  const navDropdownEnabled = useFlag('platform.chrome.navigation-dropdown');
  const search = new URLSearchParams(window.location.search).keys().next().value;
  const isActivationPath = activationRequestURLs.includes(search);
  const isITLessEnv = ITLess();
  const displayBreadcrumbs = useEnableBreadcrumbs();

  return (
    <Fragment>
      <MastheadMain className="pf-u-pl-lg pf-u-pt-0 pf-u-pb-xs">
        <MastheadBrand className="pf-u-flex-shrink-0 pf-u-mr-lg" component={(props) => <ChromeLink {...props} appId="landing" href="/" />}>
          <Logo />
        </MastheadBrand>
        <Toolbar isFullHeight>
          <ToolbarContent>
            <ToolbarGroup
              alignment={{ default: 'alignRight' }}
              className="pf-m-icon-button-group"
              widget-type="InsightsToolbar"
              visibility={{ '2xl': 'hidden' }}
            >
              <HeaderTools />
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadMain>
      <MastheadContent className="pf-u-mx-md pf-u-mx-0-on-2xl">
        {user?.identity?.account_number && !isITLessEnv && ReactDOM.createPortal(<FeedbackRoute user={user} />, document.body)}
        {user && isActivationPath && <Activation user={user} request={search} />}
        <Toolbar isFullHeight>
          <ToolbarContent>
            <ToolbarGroup variant="filter-group">
              {user && (
                <ToolbarItem>
                  <>
                    {navDropdownEnabled ? (
                      <AllServicesDropdown />
                    ) : (
                      <>
                        <ServicesLink />
                        {isITLessEnv ? user?.identity?.user?.is_org_admin && <SatelliteLink /> : <FavoritesLink />}
                      </>
                    )}
                  </>
                </ToolbarItem>
              )}
              {user && !isITLessEnv && (
                <ToolbarItem className="pf-m-hidden pf-m-visible-on-xl">
                  <ContextSwitcher user={user} className="data-hj-suppress sentry-mask" />
                </ToolbarItem>
              )}
            </ToolbarGroup>
            {searchEnabled ? (
              <ToolbarGroup className="pf-u-flex-grow-1 pf-u-mr-0 pf-u-mr-md-on-2xl" variant="filter-group">
                <SearchInput />
              </ToolbarGroup>
            ) : null}
            <ToolbarGroup
              className="pf-m-icon-button-group pf-u-ml-auto"
              visibility={{ default: 'hidden', '2xl': 'visible' }}
              widget-type="InsightsToolbar"
            >
              <HeaderTools />
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
      {displayBreadcrumbs && (
        <ToolbarGroup className="chr-c-breadcrumbs__group">
          <Breadcrumbs {...breadcrumbsProps} />
        </ToolbarGroup>
      )}
    </Fragment>
  );
};

export const HeaderTools = () => {
  const user = useSelector(({ chrome }: ReduxState) => chrome?.user);
  if (!user) {
    return <UnAuthtedHeader />;
  }
  return <Tools />;
};

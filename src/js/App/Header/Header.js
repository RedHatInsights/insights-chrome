import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import AppFilter from './AppFilter';
import { MastheadBrand, MastheadContent, MastheadMain, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import ContextSwitcher from './ContextSwitcher';
import Feedback from '../Feedback';
import Activation from '../Activation';
import { isContextSwitcherEnabled } from '../../utils/isAppNavEnabled';
import { useSelector } from 'react-redux';
import Logo from './Logo';
import ChromeLink from '../Sidenav/Navigation/ChromeLink';
import { Route } from 'react-router-dom';

import './Header.scss';

const FeedbackRoute = ({ user }) => {
  const path =
    localStorage.getItem('chrome:experimental:feedback') === 'true'
      ? '*'
      : ['/insights', '/settings', '/openshift', '/application-services', '/ansible', '/edge'];
  return (
    <Route path={path}>
      <Feedback user={user} />
    </Route>
  );
};

export const Header = () => {
  const user = useSelector(({ chrome }) => chrome?.user);
  const search = new URLSearchParams(window.location.search);
  const isActivationPath =
    search.has('azure-openshift-activation') || search.has('aws-openshift-activation') || search.has('azure-ansible-activation');

  return (
    <Fragment>
      <MastheadMain>
        <MastheadBrand component={(props) => <ChromeLink {...props} appId="landing" href="/" />}>
          <Logo />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        {user && ReactDOM.createPortal(<FeedbackRoute user={user} />, document.body)}
        {user && isActivationPath && <Activation user={user} request={search.keys().next().value} />}
        <Toolbar isFullHeight>
          <ToolbarContent>
            <ToolbarGroup variant="filter-group">
              {user && (
                <ToolbarItem>
                  <AppFilter />
                </ToolbarItem>
              )}
              {user && isContextSwitcherEnabled && (
                <ToolbarItem className="pf-m-hidden pf-m-visible-on-xl">
                  <ContextSwitcher user={user} className="data-hj-suppress" />
                </ToolbarItem>
              )}
            </ToolbarGroup>
            <HeaderTools />
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Fragment>
  );
};

Header.propTypes = {
  logoClassName: PropTypes.string,
};

FeedbackRoute.propTypes = {
  user: PropTypes.object.isRequired,
};

Header.defaultProps = {
  logoClassName: '',
};

export const HeaderTools = () => {
  const user = useSelector(({ chrome }) => chrome?.user);
  if (!user) {
    return <UnAuthtedHeader />;
  }
  return <Tools />;
};

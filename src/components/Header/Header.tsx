import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import AppFilter from '../AppFilter';
import { MastheadBrand, MastheadContent, MastheadMain, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import ContextSwitcher from '../ContextSwitcher';
import Feedback from '../Feedback';
import Activation from '../Activation';
import { useSelector } from 'react-redux';
import Logo from './Logo';
import ChromeLink from '../ChromeLink/ChromeLink';
import { Route } from 'react-router-dom';
import { activationRequestURLs } from '../../utils/consts';
import { ChromeUser } from '@redhat-cloud-services/types';
import { DeepRequired } from 'utility-types';

import './Header.scss';
import { ReduxState } from '../../redux/store';

const FeedbackRoute = ({ user }: { user: DeepRequired<ChromeUser> }) => {
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
  const user = useSelector(({ chrome }: DeepRequired<ReduxState>) => chrome.user);
  const search = new URLSearchParams(window.location.search).keys().next().value;
  const isActivationPath = activationRequestURLs.includes(search);

  return (
    <Fragment>
      <MastheadMain>
        <MastheadBrand component={(props) => <ChromeLink {...props} appId="landing" href="/" />}>
          <Logo />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        {user?.identity?.account_number && ReactDOM.createPortal(<FeedbackRoute user={user} />, document.body)}
        {user && isActivationPath && <Activation user={user} request={search} />}
        <Toolbar isFullHeight>
          <ToolbarContent>
            <ToolbarGroup variant="filter-group">
              {user && (
                <ToolbarItem>
                  <AppFilter />
                </ToolbarItem>
              )}
              {user && (
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

export const HeaderTools = () => {
  const user = useSelector(({ chrome }: ReduxState) => chrome?.user);
  if (!user) {
    return <UnAuthtedHeader />;
  }
  return <Tools />;
};

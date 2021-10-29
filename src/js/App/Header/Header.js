import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import AppFilter from './AppFilter';
import {
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
} from '@patternfly/react-core';
import ContextSwitcher from './ContextSwitcher';
import Feedback from '../Feedback';
import { isContextSwitcherEnabled } from '../../utils/isAppNavEnabled';
import { useSelector } from 'react-redux';
import Logo from './Logo';
import { Route } from 'react-router-dom';

const FeedbackRoute = ({ user }) => {
  const path =
    localStorage.getItem('chrome:experimental:feedback') === 'true' ? '*' : ['/insights', '/settings', '/openshift', '/application-services'];
  return (
    <Route path={path}>
      <Feedback user={user} />
    </Route>
  );
};

export const Header = ({ logoClassName }) => {
  const user = useSelector(({ chrome }) => chrome?.user);
  return (
    <Fragment>
      <MastheadMain>
        <MastheadBrand href="./">
          <Logo />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar isFullHeight isStatic>
          <ToolbarContent>
            {user && (
              <ToolbarItem>
                <AppFilter />
              </ToolbarItem>
            )}
            {user && isContextSwitcherEnabled && (
              <ToolbarItem>
                <ContextSwitcher user={user} className="data-hj-suppress" />
              </ToolbarItem>
            )}
            {/*         {user && <ToolbarItem><FeedbackRoute user={user} /></ToolbarItem>}*/}
            <ToolbarGroup
              className="pf-m-icon-button-group pf-m-align-right pf-m-spacer-none pf-m-spacer-md-on-md"
              alignment={{ default: 'alignRight' }}
            >
              <HeaderTools />
            </ToolbarGroup>
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

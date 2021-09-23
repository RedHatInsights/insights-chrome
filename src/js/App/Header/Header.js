import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import AppFilter from './AppFilter';
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
      <a href="./" className={`ins-m-hide-on-md ins-c-header-link${logoClassName ? ` ${logoClassName}` : ''}`}>
        <Logo />
      </a>
      {user && <AppFilter />}
      {user && isContextSwitcherEnabled && <ContextSwitcher user={user} className="data-hj-suppress" />}
      {user && <FeedbackRoute user={user} />}
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

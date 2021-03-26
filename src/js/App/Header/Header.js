import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Tools from './Tools';
import UnAuthtedHeader from './UnAuthtedHeader';
import AppFilter from './AppFilter';
import ContextSwitcher from './ContextSwitcher';
import Feedback from '../Feedback';
import { isFilterEnabled } from '../../utils/isAppNavEnabled';
import { isContextSwitcherEnabled } from '../../utils/isAppNavEnabled';
import { useSelector } from 'react-redux';
import Logo from './Logo';

const isFeedbackEnabled = localStorage.getItem('chrome:experimental:feedback') === 'true' || insights.chrome.getBundle() === 'insights';

export const Header = ({ logoClassName }) => {
  const user = useSelector(({ chrome }) => chrome?.user);
  return (
    <Fragment>
      <a href="./" className={`ins-c-header-link${logoClassName ? ` ${logoClassName}` : ''}`}>
        <Logo />
      </a>
      {user && isFilterEnabled && <AppFilter />}
      {user && isContextSwitcherEnabled && <ContextSwitcher user={user} />}
      {user && isFeedbackEnabled && <Feedback user={user} />}
    </Fragment>
  );
};

Header.propTypes = {
  logoClassName: PropTypes.string,
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

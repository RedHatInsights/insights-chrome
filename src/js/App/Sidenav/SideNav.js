import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Navigation from './Navigation';
import { connect, useDispatch } from 'react-redux';

import AppSwitcher from './AppSwitcher';
import { appNavClick } from '../../redux/actions';
import NavLoader from './Loader';
import './SideNav.scss';

export const SideNav = ({ activeTechnology, globalNav }) => {
  const dispatch = useDispatch();
  const [isFirst, setIsFirst] = useState(true);
  useEffect(() => {
    if (globalNav && isFirst) {
      const { subItems } = globalNav?.find?.(({ active }) => active) || {};
      const defaultActive =
        subItems?.find?.(({ id }) => location.pathname.split('/').find((item) => item === id)) ||
        subItems?.find?.(({ default: isDefault }) => isDefault) ||
        subItems?.[0];

      dispatch(appNavClick(defaultActive || {}));
      setIsFirst(() => false);
    }
  }, [globalNav]);

  return globalNav ? (
    <Fragment>
      {insights.chrome.isBeta() ? <div className="ins-c-app-title">{activeTechnology}</div> : <AppSwitcher currentApp={activeTechnology} />}
      <Navigation />
    </Fragment>
  ) : (
    <NavLoader />
  );
};

SideNav.propTypes = {
  activeTechnology: PropTypes.string,
  globalNav: PropTypes.arrayOf(PropTypes.object),
};

SideNav.defaultProps = {
  activeTechnology: '',
  activeLocation: '',
};

export default connect(({ chrome: { activeTechnology, globalNav, appNav } }) => ({
  activeTechnology,
  globalNav,
  appNav,
}))(SideNav);

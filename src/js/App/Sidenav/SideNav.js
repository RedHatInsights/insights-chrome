import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Navigation from './Navigation';
import { useDispatch, useSelector } from 'react-redux';

import AppSwitcher from './AppSwitcher';
import { appNavClick } from '../../redux/actions';
import NavLoader from './Loader';
import './SideNav.scss';

export const SideNav = () => {
  const dispatch = useDispatch();
  const { activeTechnology, globalNav, appId } = useSelector(({ chrome }) => chrome);
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

  return appId && globalNav ? (
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

export default SideNav;

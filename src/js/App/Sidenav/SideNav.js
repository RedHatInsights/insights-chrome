import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Navigation from './Navigation';
import { useDispatch, useSelector } from 'react-redux';

import AppSwitcher from './AppSwitcher';
import { appNavClick } from '../../redux/actions';
import NavLoader from './Loader';

export const SideNav = () => {
  const dispatch = useDispatch();
  const { activeTechnology, globalNav } = useSelector(({ chrome }) => chrome);
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
      <AppSwitcher currentApp={activeTechnology} />
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

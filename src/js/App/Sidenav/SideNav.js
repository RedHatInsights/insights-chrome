import React, { Fragment, useEffect, useRef } from 'react';
import Navigation from './Navigation';
import { useDispatch, useSelector } from 'react-redux';

import { appNavClick } from '../../redux/actions';
import NavLoader from './Loader';
import './SideNav.scss';
import { globalNavComparator } from '../../utils/comparators';

export const SideNav = () => {
  const dispatch = useDispatch();

  const activeTechnology = useSelector(({ chrome }) => chrome?.activeTechnology);
  const appId = useSelector(({ chrome }) => chrome?.appId);
  const globalNav = useSelector(({ chrome }) => chrome?.globalNav, globalNavComparator);
  const isFirst = useRef(true);

  useEffect(() => {
    if (globalNav && isFirst.current) {
      const { subItems } = globalNav?.find?.(({ active }) => active) || {};
      const defaultActive =
        subItems?.find?.(({ id }) => location.pathname.split('/').find((item) => item === id)) ||
        subItems?.find?.(
          ({ reload }) => reload && reload.split('/').find((fragment) => location.pathname.split('/').find((item) => item === fragment))
        ) ||
        subItems?.find?.(({ default: isDefault }) => isDefault) ||
        subItems?.[0];

      dispatch(appNavClick(defaultActive || {}));
      isFirst.current = false;
    }
  }, [globalNav]);

  return appId && globalNav ? (
    <Fragment>
      <div className="ins-c-app-title">{activeTechnology}</div>
      <Navigation />
    </Fragment>
  ) : (
    <NavLoader />
  );
};

export default SideNav;

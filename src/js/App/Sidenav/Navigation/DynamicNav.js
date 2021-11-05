import React, { useEffect } from 'react';
import { useLoadModule } from '@scalprum/react-core';
import PropTypes from 'prop-types';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { NavItem } from '@patternfly/react-core';
import { useHistory } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { loadLeftNavSegment } from '../../../redux/actions';

const DynamicNav = ({ dynamicNav }) => {
  const {
    location: { pathname },
  } = useHistory();
  const dispatch = useDispatch();
  const [appName] = dynamicNav.split('/');
  const currentNamespace = pathname.split('/')[1];
  const schema = useSelector(({ chrome: { navigation } }) => navigation[currentNamespace]);
  const [{ default: navigation }] = useLoadModule({ appName, scope: appName, module: './Navigation' }, {});
  useEffect(() => {
    if (navigation) {
      if (typeof navigation === 'function') {
        const indexOfDynamicNav = schema.navItems.findIndex((nav) => nav.dynamicNav === dynamicNav);
        if (indexOfDynamicNav !== -1) {
          const { dynamicNav: _dynamicNav, ...originalNav } = schema.navItems[indexOfDynamicNav];
          Promise.resolve(navigation({ schema, dynamicNav, currentNamespace })).then((data) => {
            const newValue = Array.isArray(data)
              ? data.map((item) => ({
                  appId: dynamicNav.split('/')[0],
                  ...originalNav,
                  ...item,
                }))
              : [
                  {
                    ...originalNav,
                    ...data,
                  },
                ];
            dispatch(
              loadLeftNavSegment(
                {
                  ...schema,
                  navItems: schema.navItems.flatMap((item, key) => (key === indexOfDynamicNav ? newValue : item)),
                },
                currentNamespace,
                window.location.pathname,
                true
              )
            );
          });
        }
      }
    }
  }, [navigation]);
  return (
    <NavItem preventDefault>
      <a href="#">
        <Skeleton size={SkeletonSize.lg} isDark />
      </a>
    </NavItem>
  );
};

DynamicNav.propTypes = {
  dynamicNav: PropTypes.string,
};

export default DynamicNav;

import React, { useEffect } from 'react';
import { useModule } from '@scalprum/react-core';
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
  const { default: navigation } = useModule(appName, './Navigation', {});
  useEffect(() => {
    if (navigation) {
      if (typeof navigation === 'function') {
        Promise.resolve(navigation({ schema, dynamicNav, currentNamespace })).then((data) => {
          schema.navItems = schema?.navItems?.map((item, key) => ({
            ...item,
            ...(key === schema.navItems.findIndex((nav) => nav.dynamicNav === dynamicNav) && data),
          }));
          dispatch(loadLeftNavSegment(schema, currentNamespace, window.location.pathname));
        });
      }
    }
  }, [navigation]);
  return (
    <NavItem preventDefault>
      <a href="#">
        <Skeleton size={SkeletonSize.lg} className="ins-m-dark ins-c-skeleton__link" />
      </a>
    </NavItem>
  );
};

DynamicNav.propTypes = {
  dynamicNav: PropTypes.string,
};

export default DynamicNav;

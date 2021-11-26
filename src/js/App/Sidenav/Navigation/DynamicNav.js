import React, { useEffect, Fragment, useState } from 'react';
import { useLoadModule } from '@scalprum/react-core';
import PropTypes from 'prop-types';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { NavItem } from '@patternfly/react-core';
import { useHistory } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import isEqual from 'lodash/isEqual';
import ChromeNavItem from './ChromeNavItem';
import { loadLeftNavSegment } from '../../../redux/actions';

const toArray = (value) => (Array.isArray(value) ? value : [value]);
const mergeArrays = (orig, index, value) => [...orig.slice(0, index), ...toArray(value), ...orig.slice(index)];

const HookedNavigation = ({ useNavigation, dynamicNav, pathname, ...props }) => {
  const currentNamespace = pathname.split('/')[1];
  const [isLoaded, setIsLoaded] = useState(false);
  const dispatch = useDispatch();
  const schema = useSelector(({ chrome: { navigation } }) => navigation[currentNamespace]);
  const currNav = useSelector(({ chrome: { navigation } }) =>
    navigation[currentNamespace]?.navItems?.filter((item) => item.dynamicNav === dynamicNav)
  );
  const newNav = useNavigation({ schema, dynamicNav, currentNamespace, currNav });
  useEffect(() => {
    if (newNav?.length > 0) {
      const newValue = toArray(newNav).map((item, key) => ({
        appId: dynamicNav.split('/')[0],
        ...(currNav?.[key] || currNav?.[0]),
        ...item,
      }));
      if (!isEqual(newValue, currNav)) {
        const currNavIndex = schema.navItems.findIndex((item) => item.dynamicNav === dynamicNav);
        dispatch(
          loadLeftNavSegment(
            {
              ...schema,
              navItems: mergeArrays(
                schema.navItems.filter((item) => !(item.dynamicNav && item.dynamicNav === dynamicNav)),
                currNavIndex,
                newValue
              ),
            },
            currentNamespace,
            pathname,
            true
          )
        );
      }
      setIsLoaded(true);
    }
  }, [JSON.stringify(newNav)]);

  return isLoaded ? (
    <ChromeNavItem {...props} />
  ) : (
    <NavItem preventDefault>
      <a href="#">
        <Skeleton size={SkeletonSize.lg} isDark />
      </a>
    </NavItem>
  );
};

HookedNavigation.propTypes = {
  useNavigation: PropTypes.func.isRequired,
  dynamicNav: PropTypes.string.isRequired,
  pathname: PropTypes.string.isRequired,
};

const DynamicNav = ({ dynamicNav, ...props }) => {
  const {
    location: { pathname },
  } = useHistory();
  const [appName] = dynamicNav.split('/');
  const [{ useNavigation }] = useLoadModule({ appName, scope: appName, module: './Navigation' }, {});
  return useNavigation ? <HookedNavigation {...props} dynamicNav={dynamicNav} useNavigation={useNavigation} pathname={pathname} /> : <Fragment />;
};

DynamicNav.propTypes = {
  dynamicNav: PropTypes.string,
};

export default DynamicNav;

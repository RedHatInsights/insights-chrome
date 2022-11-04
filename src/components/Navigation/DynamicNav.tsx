import React, { Fragment, useEffect, useState } from 'react';
import { useLoadModule } from '@scalprum/react-core';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { NavItem } from '@patternfly/react-core';
import { useHistory } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import isEqual from 'lodash/isEqual';
import ChromeNavItem, { ChromeNavItemProps } from './ChromeNavItem';
import { loadLeftNavSegment } from '../../redux/actions';
import { Navigation, ReduxState } from '../../redux/store';
import { NavItem as NavItemType } from '../../@types/types';

const toArray = (value: NavItemType | NavItemType[]) => (Array.isArray(value) ? value : [value]);
const mergeArrays = (orig: any[], index: number, value: any[]) => [...orig.slice(0, index), ...toArray(value), ...orig.slice(index)];

export type DynamicNavProps = ChromeNavItemProps & {
  dynamicNav: string;
  useNavigation: (config: {
    schema?: Navigation | NavItemType[];
    dynamicNav: string;
    currentNamespace: string;
    currNav?: NavItemType[];
  }) => NavItemType | NavItemType[];
  pathname: string;
};

const isRootNavigation = (schema?: Navigation | NavItemType[]): schema is Navigation => {
  return !!(!Array.isArray(schema) && schema?.navItems);
};

const HookedNavigation = ({ useNavigation, dynamicNav, pathname, ...props }: DynamicNavProps) => {
  const currentNamespace = pathname.split('/')[1];
  const [isLoaded, setIsLoaded] = useState(false);
  const dispatch = useDispatch();
  const schema = useSelector(({ chrome: { navigation } }: ReduxState) => navigation[currentNamespace]);
  const currNav = useSelector(({ chrome: { navigation } }: ReduxState) =>
    (navigation[currentNamespace] as Navigation | undefined)?.navItems?.filter((item) => item.dynamicNav === dynamicNav)
  );
  const newNav = useNavigation({ schema, dynamicNav, currentNamespace, currNav });
  useEffect(() => {
    if (newNav) {
      const newValue = toArray(newNav).map((item, key) => ({
        appId: dynamicNav.split('/')[0],
        ...(currNav?.[key] || currNav?.[0]),
        ...item,
      }));
      if (!isEqual(newValue, currNav) && isRootNavigation(schema)) {
        const currNavIndex = schema.navItems.findIndex((item) => item.dynamicNav === dynamicNav);
        if (currNavIndex !== -1) {
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

const DynamicNav = ({ dynamicNav, ...props }: DynamicNavProps) => {
  const {
    location: { pathname },
  } = useHistory();
  const [appName] = dynamicNav.split('/');
  // TODO make useLoadModule generic type
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const [{ useNavigation }] = useLoadModule({ appName, scope: appName, module: './Navigation' }, {});
  return useNavigation ? <HookedNavigation {...props} dynamicNav={dynamicNav} useNavigation={useNavigation} pathname={pathname} /> : <Fragment />;
};

export default DynamicNav;

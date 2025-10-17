import React, { Fragment, useEffect, useState } from 'react';
import { useLoadModule } from '@scalprum/react-core';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { NavItem } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { useLocation } from 'react-router-dom';
import isEqual from 'lodash/isEqual';
import ChromeNavItem from './ChromeNavItem';
import { DynamicNavProps, NavItem as NavItemType, Navigation } from '../../@types/types';
import { useSetAtom } from 'jotai';
import { getDynamicSegmentItemsAtom, getNavigationSegmentAtom, setNavigationSegmentAtom } from '../../state/atoms/navigationAtom';

const toArray = (value: NavItemType | NavItemType[]) => (Array.isArray(value) ? value : [value]);
const mergeArrays = (orig: any[], index: number, value: any[]) => [...orig.slice(0, index), ...toArray(value), ...orig.slice(index)];

const isRootNavigation = (schema?: Navigation | NavItemType[]): schema is Navigation => {
  return !!(!Array.isArray(schema) && schema?.navItems);
};

const HookedNavigation = ({ useNavigation, dynamicNav, pathname, ...props }: DynamicNavProps) => {
  const currentNamespace = pathname.split('/')[1];
  const [isLoaded, setIsLoaded] = useState(false);
  const getSchema = useSetAtom(getNavigationSegmentAtom);
  const getCurrNav = useSetAtom(getDynamicSegmentItemsAtom);
  const setnavigationSegment = useSetAtom(setNavigationSegmentAtom);
  const schema = getSchema(currentNamespace);
  const currNav = getCurrNav(currentNamespace, dynamicNav);
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
          setnavigationSegment({
            schema: {
              ...schema,
              navItems: mergeArrays(
                schema.navItems.filter((item) => !(item.dynamicNav && item.dynamicNav === dynamicNav)),
                currNavIndex,
                newValue
              ),
            },
            segment: currentNamespace,
            pathname,
            shouldMerge: true,
          });
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
        <Skeleton size={SkeletonSize.lg} isDark={Array.from(document?.documentElement?.classList).includes('pf-v6-theme-dark')} />
      </a>
    </NavItem>
  );
};

const DynamicNav = ({ dynamicNav, ...props }: DynamicNavProps) => {
  const { pathname } = useLocation();
  const [appName] = dynamicNav.split('/');
  // TODO make useLoadModule generic type
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const [{ useNavigation }] = useLoadModule({ appName, scope: appName, module: './Navigation' }, {});
  return useNavigation ? <HookedNavigation {...props} dynamicNav={dynamicNav} useNavigation={useNavigation} pathname={pathname} /> : <Fragment />;
};

export default DynamicNav;

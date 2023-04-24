import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Required } from 'utility-types';

import { ReduxState } from '../redux/store';
import useBundle from './useBundle';
import { NavItem, Navigation } from '../@types/types';
import { isExpandableNav } from '../utils/common';

function isNavItems(navigation: Navigation | NavItem[]): navigation is Navigation {
  return Array.isArray((navigation as Navigation).navItems);
}

function isActiveLeaf(item: NavItem | undefined): item is Required<NavItem, 'href'> {
  return typeof item?.href === 'string' && item?.active === true;
}

function isGroup(item: NavItem): item is Required<NavItem, 'groupId'> {
  return typeof item.groupId === 'string';
}

function extractNavItemGroups(activeNavigation: Navigation | NavItem[]) {
  return (isNavItems(activeNavigation) ? activeNavigation.navItems.map((item) => (isGroup(item) ? item.navItems : item)) : activeNavigation).flat();
}

function findActiveLeaf(navItems: (NavItem | undefined)[]): { activeItem: Required<NavItem, 'href'> | undefined; navItems: NavItem[] } {
  let leaf: Required<NavItem, 'href'> | undefined;
  // store the parent nodes
  const leafPath: NavItem[] = [];
  let index = 0;
  while (leaf === undefined && index < navItems.length) {
    const item = navItems[index];
    index += 1;
    if (item && isExpandableNav(item)) {
      const { activeItem, navItems } = findActiveLeaf(item.routes) || {};
      if (activeItem) {
        leaf = activeItem;
        // append parent nodes of an active item
        leafPath.push(item, ...navItems);
      }
    } else if (isActiveLeaf(item)) {
      leaf = item;
    }
  }

  return { activeItem: leaf, navItems: leafPath };
}

const useBreadcrumbsLinks = () => {
  const { bundleId, bundleTitle } = useBundle();
  const navigation = useSelector(({ chrome: { navigation } }: ReduxState) => {
    return navigation;
  });
  const { pathname } = useLocation();
  const [segments, setSegments] = useState<Required<NavItem, 'href'>[]>([]);

  useEffect(() => {
    const segments: Required<NavItem, 'href'>[] = [
      {
        title: bundleTitle,
        href: `/${bundleId}`,
      },
    ];
    const activeNavSegment = navigation[bundleId];
    if (activeNavSegment && isNavItems(activeNavSegment)) {
      const activeNavigation = extractNavItemGroups(activeNavSegment);
      const { activeItem, navItems } = findActiveLeaf(activeNavigation);
      if (activeItem) {
        const appFragments = activeItem.href.split('/');
        appFragments.pop();
        const groupFragments: Required<NavItem, 'href'>[] = navItems.map((item, index) => ({
          ...item,
          href: appFragments.slice(0, appFragments.length - 1 - index).join('/') || `/${bundleId}`,
        }));
        segments.push(...groupFragments, activeItem);
      }
    }
    setSegments(segments);
  }, [pathname, navigation]);

  return segments;
};

export default useBreadcrumbsLinks;

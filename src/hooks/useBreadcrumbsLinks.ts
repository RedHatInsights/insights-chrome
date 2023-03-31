import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Required } from 'utility-types';

import { ReduxState } from '../redux/store';
import useBundle from './useBundle';
import { NavItem, Navigation } from '../@types/types';

function isNavItems(navigation: Navigation | NavItem[]): navigation is Navigation {
  return Array.isArray((navigation as any).navItems);
}

function isExpandableNav(item: NavItem): item is Required<NavItem, 'routes'> {
  return !!item.expandable;
}

function isGroup(item: NavItem): item is Required<NavItem, 'groupId'> {
  return typeof item.groupId === 'string';
}

function extractNavItemGroups(activeNavigation: Navigation | NavItem[]) {
  return (isNavItems(activeNavigation) ? activeNavigation.navItems.map((item) => (isGroup(item) ? item.navItems : item)) : activeNavigation).flat();
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
      const activeFragment = activeNavigation.find((item) => item?.active);
      if (activeFragment && isExpandableNav(activeFragment)) {
        const leafFragment = activeFragment.routes.find((item) => item.active);
        const groupLink = (() => {
          const appFragments = leafFragment?.href?.split('/');
          appFragments?.pop();
          return appFragments ? `${appFragments.join('/')}` : `/${bundleId}`;
        })();
        const groupFragment = { href: groupLink, ...activeFragment };
        segments.push(groupFragment, ...(leafFragment?.href ? [leafFragment as Required<NavItem, 'href'>] : []));
      } else if (activeFragment) {
        segments.push(activeFragment as Required<NavItem, 'href'>);
      }
    }
    setSegments(segments);
  }, [pathname, navigation]);

  return segments;
};

export default useBreadcrumbsLinks;

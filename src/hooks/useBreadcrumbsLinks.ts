import { useEffect, useMemo, useState } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';
import { Required } from 'utility-types';

import useBundle from './useBundle';
import { NavItem } from '../@types/types';
import { findNavLeafPath } from '../utils/common';
import { extractNavItemGroups, isNavItems } from '../utils/fetchNavigationFiles';
import { useAtomValue } from 'jotai';
import { moduleRoutesAtom } from '../state/atoms/chromeModuleAtom';
import { navigationAtom } from '../state/atoms/navigationAtom';

const useBreadcrumbsLinks = () => {
  const { bundleId, bundleTitle } = useBundle();
  const routes = useAtomValue(moduleRoutesAtom);
  const navigation = useAtomValue(navigationAtom);
  const { pathname } = useLocation();
  const [segments, setSegments] = useState<Required<NavItem, 'href'>[]>([]);
  const wildCardRoutes = useMemo(() => routes.map((item) => ({ ...item, path: `${item.path}/*` })), [routes]);

  useEffect(() => {
    const segments: Required<NavItem, 'href'>[] = [
      {
        title: bundleTitle,
        href: `/${bundleId}`,
      },
    ];
    const activeNavSegment = navigation?.[bundleId];
    if (activeNavSegment && isNavItems(activeNavSegment)) {
      const activeNavigation = extractNavItemGroups(activeNavSegment);
      const { activeItem, navItems } = findNavLeafPath(activeNavigation);
      if (activeItem) {
        const appFragments = activeItem.href.split('/');
        appFragments.pop();
        // Match first parent route. Routes are taken directly from router definitions.
        const fallbackMatch = matchRoutes(wildCardRoutes, activeItem.href) || [];
        const fallbackMatchFragments = fallbackMatch?.[0]?.pathnameBase.split('/');
        const groupFragments: Required<NavItem, 'href'>[] = navItems.map((item, index) => ({
          ...item,
          /**
           * Use the longer fragment value. If fragments are shorter than 3, fallback to value 3.
           * Must be +3 for fallback because:
           * - first fragment is always empty "" (+1),
           * - second fragment is always bundle (+1),
           * - slice is exclusive and the matched index is not included (+1)
           * Even the root level link should always include the bundle.
           *  */
          href: fallbackMatchFragments.slice(0, Math.max(index + 3, index + appFragments.length)).join('/') || `/${bundleId}`,
        }));
        segments.push(...groupFragments, activeItem);
      }
    }
    setSegments(segments);
  }, [pathname, navigation]);
  return segments;
};

export default useBreadcrumbsLinks;

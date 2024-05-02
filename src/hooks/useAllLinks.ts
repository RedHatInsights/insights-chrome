import { useEffect, useState } from 'react';
import { BundleNav, BundleNavigation, NavItem } from '../@types/types';
import fetchNavigationFiles from '../utils/fetchNavigationFiles';
import { evaluateVisibility } from '../utils/isNavItemVisible';
import { isExpandableNav } from '../utils/common';

const getFirstChildRoute = (routes: NavItem[] = []): NavItem | undefined => {
  const firstLeaf = routes.find((item) => !item.expandable && item.href);
  if (firstLeaf) {
    return firstLeaf;
  }
  let childRoute: NavItem | undefined;
  const nestedItems = firstLeaf ? [] : routes.filter((item) => item.expandable);
  // make sure to find first deeply nested item
  nestedItems.every((item) => {
    childRoute = getFirstChildRoute(item.routes);
    return !childRoute;
  });

  return childRoute;
};

const handleBundleResponse = (bundle: Omit<BundleNavigation, 'id' | 'title'> & Partial<Pick<BundleNavigation, 'id' | 'title'>>): BundleNav => {
  const flatLinks = bundle?.navItems?.reduce<(NavItem | NavItem[])[]>((acc, { navItems, routes, expandable, ...rest }) => {
    // item is a group

    if (navItems) {
      acc.push(...handleBundleResponse({ ...rest, navItems }).links);
      return acc;
    }

    if (typeof expandable !== 'undefined' && typeof routes !== 'undefined' && typeof rest.id !== 'undefined') {
      const childRoute = getFirstChildRoute(routes);
      if (childRoute) {
        const expandableLink = {
          ...childRoute,
          title: rest.title,
          description: rest.description,
          id: rest.id,
        };
        acc.push(...routes, expandableLink);
        // return acc;
      }
    }

    // item is an expandable section
    if (typeof expandable !== 'undefined' && typeof routes !== 'undefined') {
      // console.log('rest:', { ...rest, routes });
      acc.push(...handleBundleResponse({ ...rest, navItems: routes }).links);
      return acc;
    }

    // regular NavItem
    acc.push(rest);
    return acc;
  }, []);
  const bundleFirstLink = getFirstChildRoute(bundle.navItems);
  if (bundleFirstLink && bundle.id) {
    const bundleLink: NavItem = {
      ...bundleFirstLink,
      title: bundle.title,
      id: bundle.id,
      description: bundle.description,
    };
    flatLinks.push(bundleLink);
  }
  return { id: bundle.id, title: bundle.title, links: (flatLinks || []).flat() };
};

const getNavLinks = (navItems: NavItem[]): NavItem[] => {
  const links: NavItem[] = [];
  navItems.forEach((item) => {
    if (isExpandableNav(item)) {
      links.concat(getNavLinks(item.routes));
    } else if (item.groupId && item.navItems) {
      links.concat(getNavLinks(item.navItems));
    } else {
      links.push(item);
    }
  });
  return links;
};

const fetchNavigation = async () => {
  const bundlesNavigation = await fetchNavigationFiles().then((data) => data.map(handleBundleResponse));
  const parsedBundles = await Promise.all(
    bundlesNavigation.map(async (bundleNav) => ({
      ...bundleNav,
      links: (await Promise.all(bundleNav.links.map(evaluateVisibility))).filter(({ isHidden }) => !isHidden),
    }))
  );
  const allLinks = parsedBundles.map(({ links }) => getNavLinks(links)).flat();
  return allLinks;
};

const useAllLinks = () => {
  const [allLinks, setAllLinks] = useState<NavItem[]>([]);
  useEffect(() => {
    fetchNavigation().then(setAllLinks);
  }, []);
  return allLinks;
};

export default useAllLinks;

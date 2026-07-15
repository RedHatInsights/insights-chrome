import { useMemo } from 'react';
import { BundleNav, BundleNavigation, NavItem } from '../@types/types';
import { useVisibleBundles } from '../state/atoms/visibleBundlesAtom';

const getFirstChildRoute = (routes: NavItem[] = []): NavItem | undefined => {
  const firstLeaf = routes.find((item) => !item.expandable && item.href);
  if (firstLeaf) {
    return firstLeaf;
  }
  let childRoute: NavItem | undefined;
  const nestedItems = firstLeaf ? [] : routes.filter((item) => item.expandable);
  // make sure to find first deeply nested item
  nestedItems.every((item) => {
    childRoute = getFirstChildRoute(item.navItems);
    return !childRoute;
  });

  return childRoute;
};

const handleBundleResponse = (bundle: Omit<BundleNavigation, 'id' | 'title'> & Partial<Pick<BundleNavigation, 'id' | 'title'>>): BundleNav => {
  const flatLinks = bundle?.navItems?.reduce<(NavItem | NavItem[])[]>((acc, { navItems, expandable, ...rest }) => {
    // item is a group or expandable section with children
    if (navItems) {
      if (expandable === true && typeof rest.id !== 'undefined') {
        const childRoute = getFirstChildRoute(navItems);
        if (childRoute) {
          const expandableLink = {
            ...childRoute,
            title: rest.title,
            description: rest.description,
            id: rest.id,
          };
          acc.push(...navItems, expandableLink);
        }
      }

      if (expandable === true) {
        acc.push(...handleBundleResponse({ ...rest, navItems }).links);
        return acc;
      }

      acc.push(...handleBundleResponse({ ...rest, navItems }).links);
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
  navItems?.forEach((item) => {
    if (item.navItems) {
      links.push(...getNavLinks(item.navItems));
    } else {
      links.push(item);
    }
  });
  return links;
};

const useAllLinks = () => {
  const bundles = useVisibleBundles();

  return useMemo(() => {
    if (bundles.length === 0) {
      return [];
    }
    const bundleNavs = bundles.map(handleBundleResponse);
    return bundleNavs
      .map((bundleNav) => ({
        ...bundleNav,
        links: bundleNav.links.filter(({ isHidden }) => !isHidden),
      }))
      .map(({ links }) => getNavLinks(links))
      .flat();
  }, [bundles]);
};

export default useAllLinks;

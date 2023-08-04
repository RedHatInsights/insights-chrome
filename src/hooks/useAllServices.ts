import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BundleNav, BundleNavigation, NavItem } from '../@types/types';
import {
  AllServicesGroup,
  AllServicesLink,
  AllServicesSection,
  isAllServicesGroup,
  isAllServicesLink,
} from '../components/AllServices/allServicesLinks';
import { getChromeStaticPathname, isExpandableNav } from '../utils/common';
import fetchNavigationFiles from '../utils/fetchNavigationFiles';
import { evaluateVisibility } from '../utils/isNavItemVisible';

export type AvailableLinks = {
  [key: string]: NavItem;
};

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
      return [
        ...acc,
        ...handleBundleResponse({
          ...rest,
          navItems,
        }).links,
      ];
    }

    if (expandable && routes && rest.id) {
      const childRoute = getFirstChildRoute(routes);
      if (childRoute) {
        const expandableLink = {
          ...childRoute,
          title: rest.title,
          description: rest.description,
          id: rest.id,
        };
        return [...acc, ...routes, expandableLink];
      }
    }

    // item is an expandable section
    if (expandable && routes) {
      return [...acc, ...routes];
    }

    // regular NavItem
    return [...acc, rest];
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

const parseBundlesToObject = (items: NavItem[]): AvailableLinks =>
  items?.reduce<AvailableLinks>((acc, curr) => {
    // make sure nested structures are parsed as well
    if (curr.expandable && curr.routes) {
      return {
        ...acc,
        ...parseBundlesToObject(curr.routes),
      };
    }

    return curr.id
      ? {
          ...acc,
          [curr.id]: curr,
        }
      : acc;
  }, {});

const matchStrings = (value: string, searchTerm: string): boolean => {
  // convert strings to lowercase and remove any white spaces
  return value.toLocaleLowerCase().replace(/\s/gm, '').includes(searchTerm.toLocaleLowerCase().replace(/\s/gm, ''));
};

// remove links that do not include the search term
const filterAllServicesLinks = (links: (AllServicesLink | AllServicesGroup)[], filterValue: string): (AllServicesLink | AllServicesGroup)[] => {
  return links.reduce<(AllServicesLink | AllServicesGroup)[]>((acc, link) => {
    // groups have links nested, we have to filter them as well
    if (isAllServicesGroup(link)) {
      const groupLinks = filterAllServicesLinks(link.links, filterValue);
      // replace group links with filtered results
      const newGroup: AllServicesGroup = {
        ...link,
        links: groupLinks as AllServicesLink[],
      };
      // do not include empty group to result
      return [...acc, ...(groupLinks.length > 0 ? [newGroup] : [])];
    }

    // include leaf link only if it matches
    if (matchStrings(link.title, filterValue)) {
      return [...acc, link];
    }
    return acc;
  }, []);
};

// remove sections that do not include any relevant items or their title does not match the search term
const filterAllServicesSections = (allServicesLinks: AllServicesSection[], filterValue: string) => {
  return allServicesLinks.reduce<AllServicesSection[]>((acc, section) => {
    // if a section title matches, include in results
    if (matchStrings(section.title, filterValue)) {
      return [...acc, section];
    }
    // filter section links
    const sectionLinks = filterAllServicesLinks(section.links, filterValue);
    // include section only if internal links match the term
    if (sectionLinks.length > 0) {
      return [...acc, { ...section, links: sectionLinks }];
    }
    return acc;
  }, []);
};

const findNavItems = (
  items: (string | AllServicesLink | AllServicesGroup)[] = [],
  availableLinks: { id?: string; title?: string; items: AvailableLinks }[]
): (AllServicesLink | AllServicesGroup)[] =>
  items
    .map((item) => {
      if (isAllServicesGroup(item)) {
        return {
          ...item,
          links: findNavItems(item.links, availableLinks),
        };
      } else if (isAllServicesLink(item)) {
        return item;
      }
      if (typeof item !== 'string') {
        return item;
      }
      const [bundle, nav] = item.split('.');
      const currBundle = availableLinks.find(({ id }) => id === bundle)?.items || {};
      return Object.values(currBundle).find(({ id }) => id === nav);
    })
    .filter(Boolean) as (AllServicesLink | AllServicesGroup)[];

const useAllServices = () => {
  const [{ ready, error, availableSections, allLinks }, setState] = useState<{
    error: boolean;
    ready: boolean;
    allLinks: NavItem[];
    availableSections: AllServicesSection[];
  }>({
    ready: false,
    allLinks: [],
    error: false,
    availableSections: [],
  });
  const isMounted = useRef(false);
  const [filterValue, setFilterValue] = useState('');
  // TODO: move constant once the AppFilter is fully replaced
  const fetchNavigation = useCallback(
    () =>
      fetchNavigationFiles()
        .then((data) => data.map(handleBundleResponse))
        .then((data) =>
          Promise.all(
            data.map(async (bundleNav) => ({
              ...bundleNav,
              links: (await Promise.all(bundleNav.links.map(evaluateVisibility))).filter(({ isHidden }) => !isHidden),
            }))
          )
        ),
    []
  );
  const fetchSections = useCallback(
    async () =>
      (
        await axios.get<
          (Omit<AllServicesSection, 'links'> & {
            links: (string | AllServicesLink | AllServicesGroup)[];
          })[]
        >(`${getChromeStaticPathname('services')}/services.json`)
      ).data,
    []
  );
  const setNavigation = useCallback(async () => {
    const bundleItems = await fetchNavigation();
    const sections = await fetchSections();
    if (isMounted.current) {
      const availableLinks = bundleItems.map((bundle) => {
        return {
          ...bundle,
          items: parseBundlesToObject(bundle.links?.flat()),
        };
      });
      const allLinks = availableLinks.flatMap((bundle) => bundle.links.flatMap((link) => (isExpandableNav(link) ? link.routes : link)));
      const availableSections = sections
        .reduce<AllServicesSection[]>((acc, { links, ...rest }) => {
          return [
            ...acc,
            {
              ...rest,
              links: findNavItems(links, availableLinks).filter(Boolean),
            },
          ];
        }, [])
        .filter(({ links }: AllServicesSection) => {
          if (links?.length === 0) {
            return false;
          }

          return links.filter((item) => isAllServicesLink(item) || (isAllServicesGroup(item) && item.links.length !== 0)).flat().length !== 0;
        });

      setState((prev) => ({
        ...prev,
        allLinks,
        availableSections,
        ready: true,
        // no links means all bundle requests have failed
        error: availableLinks.flatMap(({ items }) => Object.keys(items || {})).length === 0,
      }));
    }
  }, [fetchSections, fetchNavigation]);
  useEffect(() => {
    isMounted.current = true;
    setNavigation();
    return () => {
      isMounted.current = false;
    };
  }, [setNavigation]);

  const linkSections = useMemo(() => filterAllServicesSections(availableSections, filterValue), [ready, filterValue]);

  // Provide a flat list of all available links
  const servicesLinks = useMemo(
    () =>
      linkSections
        .flatMap(({ links }) => links as (AllServicesGroup | AllServicesLink)[])
        .flatMap((item) => (isAllServicesGroup(item) ? item.links : item))
        .flat(),
    [linkSections]
  );

  return {
    linkSections,
    allLinks,
    servicesLinks,
    error,
    ready,
    availableSections,
    filterValue,
    setFilterValue,
    findNavItems,
  };
};

export default useAllServices;

import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { matchPath } from 'react-router-dom';
import { BundleNavigation, NavItem } from '../@types/types';
import allServicesLinks, { AllServicesGroup, AllServicesLink, AllServicesSection } from '../components/AllServices/allServicesLinks';
import { isAllServicesGroup } from '../components/AllServices/AllServicesSection';
import { requiredBundles } from '../components/AppFilter/useAppFilter';
import { isBeta, isProd } from '../utils/common';

export type AvailableLinks = {
  [key: string]: NavItem;
};

const isBetaEnv = isBeta();
const isProdEnv = isProd();

const handleBundleResponse = (bundle: { data: Omit<BundleNavigation, 'id' | 'title'> }): NavItem[] => {
  const flatLinks = bundle.data.navItems.reduce<(NavItem | NavItem[])[]>((acc, { navItems, routes, expandable, ...rest }) => {
    // item is a group
    if (navItems) {
      return [
        ...acc,
        ...handleBundleResponse({
          data: {
            ...rest,
            navItems,
          },
        }),
      ];
    }

    // item is an expandable section
    if (expandable && routes) {
      return [...acc, ...routes];
    }

    // regular NavItem
    return [...acc, rest];
  }, []);
  return flatLinks.flat();
};

const parseBundlesToObject = (items: NavItem[]) =>
  items.reduce<AvailableLinks>(
    (acc, curr) =>
      curr.href // Omit items with no href
        ? {
            ...acc,
            [curr.href]: curr,
          }
        : acc,
    {}
  );

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
const useAllServices = () => {
  const [{ availableLinks, ready, error }, setState] = useState<{
    error: boolean;
    ready: boolean;
    availableLinks: NavItem[];
  }>({
    ready: false,
    availableLinks: [],
    error: false,
  });
  const isMounted = useRef(false);
  const [filterValue, setFilterValue] = useState('');
  // TODO: move constant once the AppFilter is fully replaced
  const bundles = requiredBundles;
  useEffect(() => {
    isMounted.current = true;
    Promise.all(
      bundles.map((fragment) =>
        axios
          .get<BundleNavigation>(`${isBetaEnv ? '/beta' : ''}/config/chrome/${fragment}-navigation.json?ts=${Date.now()}`)
          .then(handleBundleResponse)
          .catch((err) => {
            console.error('Unable to load appfilter bundle', err, fragment);
            return [];
          })
      )
    ).then((bundleItems) => {
      if (isMounted.current) {
        const availableLinks = parseBundlesToObject(bundleItems.flat());
        setState((prev) => ({
          ...prev,
          availableLinks: bundleItems.flat(),
          ready: true,
          // no links means all bundle requests have failed
          error: Object.keys(availableLinks).length === 0,
        }));
      }
    });
    return () => {
      isMounted.current = false;
    };
  }, []);

  // AllServices pages section
  // update only on ready status change
  // FIXME: Remove prod filtering once the data structure is outside of chrome
  const linkSections = useMemo(() => {
    // create a flat array of all available link href
    const linksToMatch = allServicesLinks
      .flatMap((item) => {
        return item.links;
      })
      .flatMap((item) => {
        // use router "path/*" to increase number of route matches
        if (isAllServicesGroup(item)) {
          // we have to filter items before the structure is offloaded outside of Chrome
          return item.links.filter((item) => (isProdEnv ? item.prod !== false : true)).map(({ href }) => `${href}/*`);
        }
        if (isProdEnv && item.prod === false) {
          // we have to filter items before the structure is offloaded outside of Chrome
          return '';
        }
        return [`${item.href}/*`];
      })
      .filter((item) => item.length > 0);

    // use router match to remove links that are not included in current environment (chrome navigation files)
    const matchedLinks = availableLinks.reduce<(NavItem & { routeMatch: string })[]>((acc, item) => {
      const match = linksToMatch.find((link) => matchPath(link, item.href!));
      if (match) {
        return [...acc, { ...item, routeMatch: match }];
      }

      return acc;
    }, []);

    // pre-filter sections data by filter value
    // re-create all services section data with links avaiable in current environments
    return filterAllServicesSections(allServicesLinks, filterValue).reduce<AllServicesSection[]>((acc, curr) => {
      const sectionLinks = curr.links.filter((item) => {
        return isAllServicesGroup(item)
          ? item.links.filter(({ href, isExternal }) => isExternal || matchedLinks.find((link) => matchPath(link.routeMatch, href))).length > 0
          : item.isExternal || matchedLinks.find((link) => matchPath(link.routeMatch, item.href));
      });
      if (sectionLinks.length > 0) {
        return [...acc, { ...curr, links: sectionLinks }];
      }
      return acc;
    }, []);
    // run hook after data are loaded or filter value changed
  }, [ready, filterValue]);

  // Provide a flat list of all avaiable links
  const servicesLinks = useMemo(
    () =>
      linkSections
        .flatMap(({ links }) => links)
        .flatMap((item) => (isAllServicesGroup(item) ? item.links : item))
        .flat(),
    [linkSections]
  );

  return {
    linkSections,
    servicesLinks,
    error,
    ready,
    filterValue,
    setFilterValue,
  };
};

export default useAllServices;

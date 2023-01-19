import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { matchPath } from 'react-router-dom';
import { BundleNavigation, NavItem } from '../@types/types';
import allServicesLinks, { AllServicesSection } from '../components/AllServices/allServicesLinks';
import { isAllServicesGroup } from '../components/AllServices/AllServicesSection';
import { requiredBundles } from '../components/AppFilter/useAppFilter';
import { isBeta } from '../utils/common';

export type AvailableLinks = {
  [key: string]: NavItem;
};

const isBetaEnv = isBeta();

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

const useAllServices = () => {
  const [{ availableLinks, ready, error }, setState] = useState<{ error: boolean; ready: boolean; availableLinks: NavItem[] }>({
    ready: false,
    availableLinks: [],
    error: false,
  });
  // TODO: move constant once the AppFilter is fully replaced
  const bundles = requiredBundles;
  useEffect(() => {
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
      const availableLinks = parseBundlesToObject(bundleItems.flat());
      setState({
        availableLinks: bundleItems.flat(),
        ready: true,
        // no links means all bundle requests have failed
        error: Object.keys(availableLinks).length === 0,
      });
    });
  }, []);

  // AllServices pages section
  // update only on ready status change
  const linkSections = useMemo(() => {
    // create a flat array of all available link href
    const linksToMatch = allServicesLinks
      .flatMap((item) => {
        return item.links;
      })
      .flatMap((item) => {
        if (isAllServicesGroup(item)) {
          return item.links.map(({ href }) => href);
        }
        return [item.href];
      });

    // use router match to remove links that are not included in current environment (chrome navigation files)
    const matchedLinks = availableLinks.reduce<(NavItem & { routeMatch?: string })[]>((acc, item) => {
      const match = linksToMatch.find((link) => matchPath(item.href!, link) || matchPath(`${item.href}/*`, link));
      if (match) {
        return [...acc, { ...item, routeMatch: match }];
      }

      return acc;
    }, []);

    // re-create all services section data with links avaiable in current environments
    return allServicesLinks.reduce<AllServicesSection[]>((acc, curr) => {
      const sectionLinks = curr.links.filter((item) =>
        isAllServicesGroup(item)
          ? item.links.filter(({ href, isExternal }) => isExternal || matchedLinks.find((link) => link.href === href || link.routeMatch === href))
              .length > 0
          : item.isExternal || matchedLinks.find((link) => link.href === item.href || link.routeMatch === item.href)
      );
      if (sectionLinks.length > 0) {
        return [...acc, { ...curr, links: sectionLinks }];
      }
      return acc;
    }, []);
  }, [ready]);

  return {
    linkSections,
    error,
    ready,
  };
};

export default useAllServices;

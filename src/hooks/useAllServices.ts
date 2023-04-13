import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BundleNavigation, NavItem } from '../@types/types';
import {
  AllServicesGroup,
  AllServicesLink,
  AllServicesSection,
  isAllServicesGroup,
  isAllServicesLink,
} from '../components/AllServices/allServicesLinks';
import { requiredBundles } from '../components/AppFilter/useAppFilter';
import { getChromeStaticPathname, isBeta } from '../utils/common';

export type AvailableLinks = {
  [key: string]: NavItem;
};

type BundleNav = {
  id?: string;
  title?: string;
  links: NavItem[];
};

const handleBundleResponse = (bundle: {
  data: Omit<BundleNavigation, 'id' | 'title'> & Partial<Pick<BundleNavigation, 'id' | 'title'>>;
}): BundleNav => {
  const flatLinks = bundle.data?.navItems?.reduce<(NavItem | NavItem[])[]>((acc, { navItems, routes, expandable, ...rest }) => {
    // item is a group
    if (navItems) {
      return [
        ...acc,
        ...handleBundleResponse({
          data: {
            ...rest,
            navItems,
          },
        }).links,
      ];
    }

    // item is an expandable section
    if (expandable && routes) {
      return [...acc, ...routes];
    }

    // regular NavItem
    return [...acc, rest];
  }, []);
  return { id: bundle.data.id, title: bundle.data.title, links: (flatLinks || []).flat() };
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
      const groupLinks = filterAllServicesLinks(link.links as AllServicesLink[], filterValue);
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
  return allServicesLinks.reduce<AllServicesSection[]>((acc: any, section: any) => {
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
      const [bundle, nav] = (item as string).split('.');
      const currBundle = availableLinks.find(({ id }) => id === bundle)?.items || {};
      return Object.values(currBundle).find(({ id }) => id === nav);
    })
    .filter(Boolean) as (AllServicesLink | AllServicesGroup)[];

const useAllServices = () => {
  const [{ ready, error, availableSections }, setState] = useState<{
    error: boolean;
    ready: boolean;
    availableLinks: BundleNav[];
    availableSections: AllServicesSection[];
  }>({
    ready: false,
    availableLinks: [],
    error: false,
    availableSections: [],
  });
  const isMounted = useRef(false);
  const [filterValue, setFilterValue] = useState('');
  // TODO: move constant once the AppFilter is fully replaced
  const bundles = requiredBundles;
  const fetchNavitation = useCallback(
    () =>
      Promise.all(
        bundles.map((fragment) =>
          axios
            .get<BundleNav>(`${getChromeStaticPathname('navigation')}/${fragment}-navigation.json?ts=${Date.now()}`)
            .catch(() => axios.get<BundleNavigation>(`${isBeta() ? '/beta' : ''}/config/chrome/${fragment}-navigation.json?ts=${Date.now()}`))
            .then(handleBundleResponse)
            .catch((err) => {
              console.error('Unable to load appfilter bundle', err, fragment);
              return [];
            })
        )
      ),
    []
  );
  const fetchSections = useCallback(
    async (): Promise<
      (Omit<AllServicesSection, 'links'> & {
        links: (string | AllServicesLink | AllServicesGroup)[];
      })[]
    > => (await axios.get(`${getChromeStaticPathname('services')}/services.json`)).data,
    []
  );
  useEffect(() => {
    isMounted.current = true;
    const setNavigation = async () => {
      const bundleItems = await fetchNavitation();
      const sections = await fetchSections();
      if (isMounted.current) {
        const availableLinks = (bundleItems as BundleNav[]).map((bundle) => {
          return {
            ...bundle,
            items: parseBundlesToObject(bundle.links.flat()),
          };
        });
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
          availableLinks: bundleItems as BundleNav[],
          availableSections,
          ready: true,
          // no links means all bundle requests have failed
          error: availableLinks.flatMap(({ items }) => Object.keys(items)).length === 0,
        }));
      }
    };
    setNavigation();
    return () => {
      isMounted.current = false;
    };
  }, [fetchSections, fetchNavitation]);

  const linkSections = useMemo(() => filterAllServicesSections(availableSections, filterValue), [ready, filterValue]);

  // Provide a flat list of all avaiable links
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
    servicesLinks,
    error,
    ready,
    filterValue,
    setFilterValue,
  };
};

export default useAllServices;

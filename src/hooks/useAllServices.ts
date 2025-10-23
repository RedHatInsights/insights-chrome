import axios, { AxiosResponse } from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavItem } from '../@types/types';
import { AllServicesGroup, AllServicesLink, AllServicesSection, isAllServicesGroup, isAllServicesLink } from '../components/AllServices/allServicesLinks';
import { getChromeStaticPathname } from '../utils/common';
import { evaluateVisibility } from '../utils/isNavItemVisible';
import useFeoConfig from './useFeoConfig';

export type AvailableLinks = {
  [key: string]: NavItem;
};

const allServicesFetchCache: {
  [qeury: string]: Promise<
    AxiosResponse<
      (Omit<AllServicesSection, 'links'> & {
        links: (AllServicesLink | AllServicesGroup)[];
      })[]
    >
  >;
} = {};

const matchStrings = (value = '', searchTerm: string): boolean => {
  // convert strings to lowercase and remove any white spaces
  return value.toLocaleLowerCase().replace(/\s/gm, '').includes(searchTerm.toLocaleLowerCase().replace(/\s/gm, ''));
};

// remove links that do not include the search term
const filterAllServicesLinks = (links: (AllServicesLink | AllServicesGroup)[], filterValue: string): (AllServicesLink | AllServicesGroup)[] => {
  return links.reduce<(AllServicesLink | AllServicesGroup)[]>((acc, link) => {
    // groups have links nested, we have to filter them as well
    if (isAllServicesGroup(link)) {
      if (matchStrings(link.title, filterValue)) {
        return [...acc, link];
      }
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

type EnhancedSection = AllServicesSection & { linksQue?: Promise<any>[] };

const evaluateLinksVisibility = async (sections: AllServicesSection[]): Promise<AllServicesSection[]> => {
  const que: EnhancedSection[] = [];
  sections.forEach((section) => {
    const newLinksQue = section.links.map(async (link) => {
      if (isAllServicesGroup(link) && link.links) {
        const nestedLinksQue = await link.links.map(evaluateVisibility);
        const links = await Promise.all(nestedLinksQue);
        return { ...link, links };
      } else if (isAllServicesLink(link)) {
        return evaluateVisibility(link);
      }
    });
    que.push({ ...section, linksQue: newLinksQue });
  });

  const groupQue = await Promise.all(que);
  for (const section of groupQue) {
    const links = await Promise.all(section.linksQue ?? []);
    section.links = [];
    links.forEach((link) => {
      if ((isAllServicesGroup(link) || isAllServicesLink(link)) && !(link as NavItem).isHidden) {
        if (isAllServicesGroup(link)) {
          section.links.push({ ...link, links: link.links.filter((item) => !(item as NavItem).isHidden) });
        } else {
          section.links.push(link);
        }
      }
    });
    delete section.linksQue;
  }

  return groupQue;
};

const GENERATED_SERVICES_PATH = '/api/chrome-service/v1/static/service-tiles-generated.json';

const useAllServices = () => {
  const [{ ready, error, availableSections }, setState] = useState<{
    error: boolean;
    ready: boolean;
    availableSections: AllServicesSection[];
  }>({
    ready: false,
    error: false,
    availableSections: [],
  });
  const useFeoGenerated = useFeoConfig();
  const isMounted = useRef(false);
  const [filterValue, setFilterValue] = useState('');
  const fetchSections = useCallback(
    async (abortSignal: AbortSignal) => {
      const query = useFeoGenerated ? GENERATED_SERVICES_PATH : `${getChromeStaticPathname('services')}/services-generated.json`;
      let request = allServicesFetchCache[query];
      if (!request) {
        request = axios.get<
          (Omit<AllServicesSection, 'links'> & {
            links: (AllServicesLink | AllServicesGroup)[];
          })[]
        >(query, {
          signal: abortSignal,
        });
        allServicesFetchCache[query] = request;
      }

      const response = await request;
      // clear the cache
      delete allServicesFetchCache[query];

      return evaluateLinksVisibility(response.data);
    },
    [useFeoGenerated]
  );

  const setNavigation = useCallback(
    async (abortSignal: AbortSignal) => {
      try {
        const sections = await fetchSections(abortSignal);
        if (isMounted.current) {
          const availableSections = sections.filter(({ links }: AllServicesSection) => {
            if (links?.length === 0) {
              return false;
            }

            return links.filter((item) => isAllServicesLink(item) || (isAllServicesGroup(item) && item.links.length !== 0)).flat().length !== 0;
          });

          setState((prev) => ({
            ...prev,
            availableSections,
            ready: true,
          }));
        }
      } catch (error) {
        // ignore abort errors
        if (!axios.isCancel(error)) {
          throw error;
        }
      }
    },
    [fetchSections, useFeoGenerated]
  );
  useEffect(() => {
    const abortCtrl = new AbortController();
    isMounted.current = true;
    setNavigation(abortCtrl.signal);
    return () => {
      isMounted.current = false;
      abortCtrl.abort();
    };
  }, [setNavigation, useFeoGenerated]);

  const linkSections = useMemo(() => filterAllServicesSections(availableSections, filterValue), [ready, filterValue, useFeoGenerated, availableSections]);

  return {
    linkSections,
    error,
    ready,
    availableSections,
    filterValue,
    setFilterValue,
  };
};

export default useAllServices;

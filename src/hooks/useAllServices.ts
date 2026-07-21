import { useMemo, useState } from 'react';
import { NavItem } from '../@types/types';
import { AllServicesGroup, AllServicesLink, AllServicesSection, isAllServicesGroup, isAllServicesLink } from '../components/AllServices/allServicesLinks';
import { useVisibleServiceTiles } from '../state/atoms/visibleBundlesAtom';

export type AvailableLinks = {
  [key: string]: NavItem;
};

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

const useAllServices = () => {
  const { tiles, ready, error } = useVisibleServiceTiles();
  const [filterValue, setFilterValue] = useState('');

  const availableSections = useMemo(() => {
    return tiles.filter(({ links }) => {
      if (!links || links.length === 0) {
        return false;
      }
      return links.filter((item) => isAllServicesLink(item) || (isAllServicesGroup(item) && item.links.length !== 0)).flat().length !== 0;
    });
  }, [tiles]);
  const linkSections = useMemo(() => filterAllServicesSections(availableSections, filterValue), [availableSections, filterValue]);

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

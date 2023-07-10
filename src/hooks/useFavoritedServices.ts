import { ServiceTileProps } from '../components/FavoriteServices/ServiceTile';
import useAllServices from './useAllServices';
import { useEffect, useMemo, useState } from 'react';
import fetchNavigationFiles, { extractNavItemGroups } from '../utils/fetchNavigationFiles';
import { NavItem, Navigation } from '../@types/types';
import { findNavLeafPath } from '../utils/common';
import useFavoritePagesWrapper from './useFavoritePagesWrapper';
import { AllServicesGroup } from '../components/AllServices/allServicesLinks';

const useFavoritedServices = () => {
  const { favoritePages } = useFavoritePagesWrapper();
  const { allLinks, availableSections } = useAllServices();
  const [fakeBundle, setFakeBundle] = useState<Navigation | undefined>(undefined);
  const [bundles, setBundles] = useState<Navigation[]>([]);

  useEffect(() => {
    fetchNavigationFiles()
      .then((data) => setBundles(data as Navigation[]))
      .catch((error) => {
        console.error('Unable to fetch favorite services', error);
      });
  }, []);

  useEffect(() => {
    if (availableSections.length !== 0 && !fakeBundle) {
      const navItems = availableSections
        .reduce<NavItem[]>((acc, curr) => {
          const fakeLink = curr.links.filter((link) => (link as AllServicesGroup).isGroup !== true);
          return [...acc, fakeLink as NavItem];
        }, [])
        .flat();
      setFakeBundle({
        navItems: navItems,
      } as Navigation);
    }
  }, [availableSections, fakeBundle]);

  const linksWithFragments = useMemo(() => {
    // push items with unique hrefs from our fake bundle for leaf creation
    fakeBundle?.navItems.forEach((item) => {
      if (!allLinks.some((link) => link.href === item.href)) {
        allLinks.push(item);
      }
    });
    return allLinks.map((link) => {
      let linkLeaf: ReturnType<typeof findNavLeafPath> | undefined;
      // use every to exit early if match was found
      [...bundles, fakeBundle || []].every((bundle) => {
        const leaf = findNavLeafPath(extractNavItemGroups(bundle), (item) => item?.href === link.href);
        if (leaf.activeItem) {
          linkLeaf = leaf;
          return false;
        }
        return true;
      });
      return {
        ...link,
        linkLeaf,
      };
    });
  }, [allLinks, bundles, fakeBundle]);

  // extract human friendly data from the all services data set
  const favoriteServices = favoritePages.reduce<ServiceTileProps[]>((acc, curr) => {
    const service = linksWithFragments.find((service) => !service.isExternal && service.href?.includes(curr.pathname));
    // only pick favorite link if it is favorite and application exists in our all services registry

    if (curr.favorite && service) {
      // construct title from fragments
      const title = [...(service.linkLeaf?.navItems || []).map(({ title }) => title || ''), service.title].join(' | ');
      return [
        ...acc,
        {
          name: title,
          pathname: curr.pathname,
          description: service.description,
        },
      ];
    }

    return acc;
  }, []);
  return favoriteServices;
};

export default useFavoritedServices;

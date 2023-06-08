import { ServiceTileProps } from '../components/FavoriteServices/ServiceTile';
import useAllServices from './useAllServices';
import { useEffect, useMemo, useState } from 'react';
import fetchNavigationFiles, { extractNavItemGroups } from '../utils/fetchNavigationFiles';
import { NavItem, Navigation } from '../@types/types';
import { findNavLeafPath } from '../utils/common';
import useFavoritePagesWrapper from './useFavoritePagesWrapper';
import { isAllServicesLink } from '../components/AllServices/allServicesLinks';

const useFavoritedServices = () => {
  const { favoritePages } = useFavoritePagesWrapper();
  const { allLinks, availableSections } = useAllServices();
  const [bundles, setBundles] = useState<Navigation[]>([]);

  const fakeBundle: NavItem[] = useMemo(() => {
    // escape early if we have no services
    if (availableSections.length === 0) {
      return [];
    }

    // map services links to nav links
    return availableSections.reduce<NavItem[]>((acc, curr) => {
      const fakeNavItems: NavItem[] = curr.links.filter(isAllServicesLink);
      // no need to recreate the reduce array
      acc.push(...fakeNavItems);
      return acc;
    }, []);
  }, [availableSections]);

  useEffect(() => {
    fetchNavigationFiles()
      .then((data) => setBundles(data as Navigation[]))
      .catch((error) => {
        console.error('Unable to fetch favorite services', error);
      });
  }, []);

  const linksWithFragments = useMemo(() => {
    // push items with unique hrefs from our fake bundle for leaf creation
    fakeBundle.forEach((item) => {
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

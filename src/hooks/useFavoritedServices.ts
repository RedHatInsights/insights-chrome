import { useFavoritePages } from '@redhat-cloud-services/chrome';
import { ServiceTileProps } from '../components/FavoriteServices/ServiceTile';
import useAllServices from './useAllServices';
import { useEffect, useMemo, useState } from 'react';
import fetchNavigationFiles, { extractNavItemGroups } from '../utils/fetchNavigationFiles';
import { Navigation } from '../@types/types';
import { findNavLeafPath } from '../utils/common';

const useFavoritedServices = () => {
  const { favoritePages } = useFavoritePages();
  const { allLinks } = useAllServices();
  const [bundles, setBundles] = useState<Navigation[]>([]);

  useEffect(() => {
    fetchNavigationFiles()
      .then((data) => setBundles(data as Navigation[]))
      .catch((error) => {
        console.error('Unable to fetch favorite services', error);
      });
  }, []);
  const linksWithFragments = useMemo(() => {
    return allLinks.map((link) => {
      let linkLeaf: ReturnType<typeof findNavLeafPath> | undefined;
      // use every to exit early if match was found
      bundles.every((bundle) => {
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
  }, [allLinks, bundles]);

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

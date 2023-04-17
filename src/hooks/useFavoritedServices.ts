import { useFavoritePages } from '@redhat-cloud-services/chrome';
import { AllServicesLink } from '../components/AllServices/allServicesLinks';
import { ServiceTileProps } from '../components/FavoriteServices/ServiceTile';
import useAllServices from './useAllServices';

const useFavoritedServices = () => {
  const { favoritePages } = useFavoritePages();
  const { servicesLinks } = useAllServices();

  // extract human friendly data from the all services data set
  const favoritedServices = favoritePages.reduce<ServiceTileProps[]>((acc, curr) => {
    const service = servicesLinks.find((service) => !service.isExternal && service.href.includes(curr.pathname)) as AllServicesLink;
    // only pick favorite link if it is favorited and application exists in our all services registry
    if (curr.favorite && service) {
      return [
        ...acc,
        {
          name: service.title,
          pathname: curr.pathname,
          description: service.description,
        },
      ];
    }

    return acc;
  }, []);
  return favoritedServices;
};

export default useFavoritedServices;

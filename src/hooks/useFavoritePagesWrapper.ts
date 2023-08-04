import { useFavoritePages } from '@redhat-cloud-services/chrome';
import { useSegment } from '../analytics/useSegment';

const FAVORITE_PAGE_EVENT = 'page-favorite';
const UNFAVORITE_PAGE_EVENT = 'page-unfavorite';

const useFavoritePagesWrapper = () => {
  const { favoritePage, unfavoritePage, ...rest } = useFavoritePages();
  const { ready, analytics } = useSegment();

  const favoritePageInternal: typeof favoritePage = (pathname) => {
    if (ready && analytics) {
      analytics.track(FAVORITE_PAGE_EVENT, {
        pathname,
      });
    }
    return favoritePage(pathname);
  };

  const unfavoritePageInternal: typeof unfavoritePage = (pathname) => {
    if (ready && analytics) {
      analytics.track(UNFAVORITE_PAGE_EVENT, {
        pathname,
      });
    }
    return unfavoritePage(pathname);
  };
  return {
    ...rest,
    favoritePage: favoritePageInternal,
    unfavoritePage: unfavoritePageInternal,
  };
};

export default useFavoritePagesWrapper;

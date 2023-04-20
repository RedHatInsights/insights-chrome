import { useFlag } from '@unleash/proxy-client-react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const useEnableBreadcrumbs = () => {
  const { pathname } = useLocation();
  const breadcrumbEnabled = useFlag('platform.chrome.bredcrumbs.enabled');
  const displayBreadcrumbs = useMemo(
    () => breadcrumbEnabled && !['/', '/allservices', '/favoritedservices'].includes(pathname),
    [pathname, breadcrumbEnabled]
  );

  return displayBreadcrumbs;
};

export default useEnableBreadcrumbs;

import { useContext, useEffect } from 'react';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { ChromeUser } from '@redhat-cloud-services/types';
import { isAnsibleTrialFlagActive } from '../utils/isAnsibleTrialFlagActive';

const ignoredPaths = ['/ansible/trial/*', '/ansible/ansible-dashboard/trial/*'];

const redirects: {
  [pattern: string]: {
    redirect: string;
    entitlementsKey: string;
    getTempTrialFlag: () => boolean;
  };
} = {
  'ansible/*': { redirect: '/ansible/ansible-dashboard/trial', entitlementsKey: 'ansible', getTempTrialFlag: isAnsibleTrialFlagActive },
};

function useTrialRedirect() {
  const { user } = useContext(ChromeAuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleTrialRedirect(pathname: string, entitlements: ChromeUser['entitlements']) {
    const isIgnored = ignoredPaths.some((path) => matchPath(path, pathname));
    if (isIgnored) {
      return;
    }
    const match = Object.keys(redirects).find((path) => matchPath(path, pathname));
    if (match && entitlements[redirects[match].entitlementsKey]) {
      const entitlement = entitlements[redirects[match].entitlementsKey];
      if (!(entitlement.is_entitled || entitlement.is_trial) && !redirects[match].getTempTrialFlag()) {
        navigate(redirects[match].redirect);
      }
    }
  }
  useEffect(() => {
    handleTrialRedirect(pathname, user.entitlements);
  }, [pathname, user.entitlements]);
}

export default useTrialRedirect;

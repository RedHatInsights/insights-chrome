import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { login } from '../jwt/jwt';
import { ReduxState } from '../redux/store';
import { LOGIN_TYPE_STORAGE_KEY } from '../utils/common';

/**
 * If required, attempt to reauthenticated current user with full profile login.
 */
const useUserProfile = () => {
  const getCurrentProfile = () => localStorage.getItem(LOGIN_TYPE_STORAGE_KEY);
  // get scope module definition
  const activeModule = useSelector(({ chrome: { activeModule, modules } }: ReduxState) => (activeModule ? (modules || {})[activeModule] : undefined));
  useEffect(() => {
    const shouldLoginFullProfile =
      // normal scenario for account with completed full profile
      ((activeModule?.config?.fullProfile || activeModule?.fullProfile) && getCurrentProfile() !== 'rhfull') ||
      // scenario for incomplete full profile account after redirect from sso
      ((activeModule?.config?.fullProfile || activeModule?.fullProfile) &&
        getCurrentProfile() === 'rhfull' &&
        // make sure the full profile was completed by checking for SSO referer (can occur if the browser back button was clicked from SSO)
        document.referrer.match(/sso\.[a-z]+\.redhat\.com/));

    // if current login scope is not full profile and scope requires it, trigger full profile login`
    if (shouldLoginFullProfile) {
      login(true);
    }
  }, [activeModule]);
};

export default useUserProfile;

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { login } from '../jwt/jwt';
import { ReduxState } from '../redux/store';
import { LOGIN_TYPE_STORAGE_KEY } from '../utils/common';

/**
 * If required, attempt to reauthenticated current user with full profile login.
 */
const useUserProfile = () => {
  // get scope module definition
  const activeModule = useSelector(({ chrome: { activeModule, modules } }: ReduxState) => (activeModule ? (modules || {})[activeModule] : undefined));
  useEffect(() => {
    // check current login method
    const currentProfile = localStorage.getItem(LOGIN_TYPE_STORAGE_KEY);
    // if current login scope is not full profile and scope requires it, trigger full profile login`
    if ((activeModule?.config?.fullProfile || activeModule?.fullProfile) && currentProfile !== 'rhfull') {
      login(true);
    }
  }, [activeModule]);
};

export default useUserProfile;

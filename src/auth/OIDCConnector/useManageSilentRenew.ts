import { useEffect } from 'react';
import { AuthContextProps } from 'react-oidc-context';

const useManageSilentRenew = (auth: AuthContextProps, login: () => Promise<void>) => {
  useEffect(() => {
    let visibilityState = document.visibilityState;
    function loginOnTokenExpired() {
      if (typeof auth.user?.expires_at === 'number') {
        const currentDate = new Date();
        // KC does not give the correct timestamp UNIX format, it has to be multiplied by 1000
        const expiredDate = new Date(auth.user?.expires_at * 1000);
        if (expiredDate < currentDate) {
          login();
        }
      }
    }
    function visibilityListener() {
      if (visibilityState !== document.visibilityState && document.visibilityState === 'visible') {
        // we went from non visible to visible (tab went into focus for various reasons)
        loginOnTokenExpired();
      }
      visibilityState = document.visibilityState;
    }

    function networkOnlineListener() {
      loginOnTokenExpired();
      auth.startSilentRenew();
    }

    function networkOfflineListener() {
      auth.stopSilentRenew();
    }

    window.addEventListener('online', networkOnlineListener);
    window.addEventListener('offline', networkOfflineListener);
    document.addEventListener('visibilitychange', visibilityListener);

    return () => {
      window.removeEventListener('online', networkOnlineListener);
      window.removeEventListener('offline', networkOfflineListener);
      document.removeEventListener('visibilitychange', visibilityListener);
    };
  }, [auth, login]);
};

export default useManageSilentRenew;

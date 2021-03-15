import { useEffect, useState } from 'react';
import { load } from 'js-yaml';
import { getNavFromConfig } from '../nav/globalNav';
import sourceOfTruth from '../nav/sourceOfTruth';

const appIds = ['insights', 'openshift', 'cost-management', 'migrations', 'subscriptions', 'ansible', 'settings'];

const useGlobalNav = () => {
  const [state, setState] = useState({
    isOpen: false,
    apps: [],
    filteredApps: [],
    isLoaded: false,
  });
  const setFilteredApps = (filteredApps) => setState((prev) => ({ ...prev, filteredApps }));
  const setIsOpen = (isOpen) => setState((prev) => ({ ...prev, isOpen }));
  useEffect(() => {
    if (state.isOpen === true && state.isLoaded === false) {
      setState({ ...state, isLoaded: null });
      (async () => {
        const navigationYml = await sourceOfTruth();
        const appData = await getNavFromConfig(load(navigationYml), undefined);
        setState(({ isOpen }) => ({
          apps: appIds.map((id) => appData[id]).filter((app) => !!app),
          filteredApps: appIds.map((id) => appData[id]),
          isLoaded: true,
          isOpen,
        }));
      })();
    }
  }, [state.isOpen]);

  return { ...state, setFilteredApps, setIsOpen };
};

export default useGlobalNav;

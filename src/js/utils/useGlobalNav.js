import { useEffect, useState } from 'react';
import { load } from 'js-yaml';
import { getNavFromConfig } from '../nav/globalNav';
import sourceOfTruth from '../nav/sourceOfTruth';

const appIds = ['insights', 'openshift', 'cost-management', 'migrations', 'subscriptions', 'ansible', 'settings'];

const useGlobalNav = () => {
  const [state, setState] = useState({
    apps: [],
    filteredApps: [],
    isLoaded: false,
  });
  const setFilteredApps = (filteredApps) => setState((prev) => ({ ...prev, filteredApps }));
  useEffect(() => {
    (async () => {
      const navigationYml = await sourceOfTruth();
      const appData = await getNavFromConfig(load(navigationYml), undefined);
      setState({ apps: appIds.map((id) => appData[id]).filter((app) => !!app), filteredApps: appIds.map((id) => appData[id]), isLoaded: true });
    })();
  }, []);

  return { ...state, setFilteredApps };
};

export default useGlobalNav;

import { useEffect, useState } from 'react';
import { load } from 'js-yaml';
import { getNavFromConfig } from '../nav/globalNav';
import sourceOfTruth from '../nav/sourceOfTruth';

const appIds = ['insights', 'openshift', 'cost-management', 'migrations', 'subscriptions', 'ansible', 'settings'];

const extraApps = [
  {
    title: 'Insights for SAP',
    id: 'SAP',
    routes: [{ id: 'sap-dashboard', title: 'Dashboard' }],
    isEntitled: async () => await insights.chrome.auth.getUser().entitlements?.insights?.is_entitled,
  },
];

const useGlobalNav = () => {
  const [state, setState] = useState({
    isOpen: false,
    apps: [],
    filteredApps: [],
    isLoaded: false,
    filterValue: '',
  });
  const setIsOpen = (isOpen) => setState((prev) => ({ ...prev, isOpen }));
  const setFilterValue = (filterValue = '') => setState((prev) => ({ ...prev, filterValue }));
  useEffect(() => {
    if (state.isOpen === true && state.isLoaded === false) {
      setState({ ...state, isLoaded: null });
      (async () => {
        const navigationYml = await sourceOfTruth();
        const appData = await getNavFromConfig(load(navigationYml), undefined);
        setState((prev) => {
          const apps = appIds.map((id) => appData[id]).filter((app) => !!app);
          return {
            ...prev,
            apps: apps,
            filteredApps: appIds.map((id) => ({
              ...appData[id],
              parent: apps?.find(({ routes }) => routes?.find(({ id: appId }) => appId === id)),
            })),
            isLoaded: true,
          };
        });
      })();
    }
  }, [state.isOpen]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      filteredApps: [...prev.apps, ...extraApps.filter((app) => app.isEntitled())]
        .map((app) => ({ ...app, routes: app.routes.filter((subApp) => subApp.title.toLowerCase().includes(state.filterValue.toLowerCase())) }))
        .filter((app) => app.routes?.length > 0),
    }));
  }, [state.filterValue]);

  return { ...state, setFilterValue, setIsOpen };
};

export default useGlobalNav;

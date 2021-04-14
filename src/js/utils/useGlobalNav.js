import { useEffect, useState } from 'react';
import { load } from 'js-yaml';
import sourceOfTruth from '../nav/sourceOfTruth';

// TODO: add App services 26.4. for release
const allowedApps = [
  { id: 'openshift', title: 'Openshift', routes: [{ id: '', title: 'Clusters' }, { id: 'subscriptions' }, { id: 'cost-management' }] },
  {
    id: 'insights',
    title: 'Red Hat Enterprise Linux',
    routes: [
      { id: 'dashboard' },
      { id: 'advisor' },
      { id: 'drift' },
      { id: 'inventory' },
      { id: 'vulnerability' },
      { id: 'compliance' },
      { id: 'policies' },
      { id: 'patch' },
      { id: 'subscriptions' },
      { id: 'remediations' },
    ],
  },
  { id: 'ansible', routes: [{ id: 'automation-hub' }, { id: 'catalog' }, { id: 'automation-analytics' }] },
  {
    id: 'settings',
    routes: [{ id: 'my-user-access' }, { id: 'rbac' }, { id: 'sources' }, { id: 'integrations' }, { id: 'notifications' }, { id: 'applications' }],
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
        const loadedYaml = load(navigationYml);
        const apps = allowedApps
          .map((app) =>
            loadedYaml[app.id]
              ? {
                  ...loadedYaml[app.id],
                  ...app,
                  routes: app.routes
                    .map((subApp) => (loadedYaml[subApp.id] ? { ...loadedYaml[subApp.id], parent: app.id, ...subApp } : null))
                    .filter((a) => a),
                }
              : null
          )
          .filter((a) => a);
        setState((prev) => {
          return {
            ...prev,
            apps: apps,
            filteredApps: apps,
            isLoaded: true,
          };
        });
      })();
    }
  }, [state.isOpen]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      filteredApps: [...prev.apps]
        .map((app) => ({ ...app, routes: app.routes.filter((subApp) => subApp.title.toLowerCase().includes(state.filterValue.toLowerCase())) }))
        .filter((app) => app.routes?.length > 0),
    }));
  }, [state.filterValue]);

  return { ...state, setFilterValue, setIsOpen };
};

export default useGlobalNav;

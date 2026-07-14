import { useEffect, useState } from 'react';
import { BundleNavigation, ChromeModule, NavItem } from '../../@types/types';
import { useAtomValue } from 'jotai';
import { chromeModulesAtom } from '../../state/atoms/chromeModuleAtom';
import { useVisibleBundles } from '../../state/atoms/visibleBundlesAtom';

export type AppFilterBucket = {
  id: string;
  title: string;
  links: NavItem[];
};

export const requiredBundles = ['application-services', 'openshift', 'insights', 'ansible', 'settings', 'iam', 'quay', 'subscriptions'];

export const itLessBundles = ['openshift', 'insights', 'settings', 'iam'];

const bundlesOrder = ['application-services', 'openshift', 'rhel', 'ansible', 'settings', 'cost-management', 'subscriptions', 'iam', 'quay'];

function findModuleByLink(href: string, { modules }: Pick<ChromeModule, 'modules'> = { modules: [] }) {
  const routes = (modules || [])
    .flatMap(({ routes }) => routes.map((route) => (typeof route === 'string' ? route : route.pathname)))
    .sort((a, b) => (a.length < b.length ? 1 : -1));
  return routes.find((route) => href.includes(route)) || '';
}

function getBundleLink({ title, isExternal, href, routes, expandable, ...rest }: NavItem, modules: { [key: string]: ChromeModule }) {
  const costLinks: NavItem[] = [];
  const subscriptionsLinks: NavItem[] = [];
  let url = href;
  let appId = rest.appId!;
  if (expandable) {
    routes?.forEach(({ href, title, ...rest }) => {
      if (href?.includes('/openshift/cost-management') && rest.filterable !== false) {
        costLinks.push({ ...rest, isFedramp: false, href, title });
      }

      if (rest.filterable !== false && (href?.includes('/insights/subscriptions') || href?.includes('/openshift/subscriptions'))) {
        subscriptionsLinks.push({
          ...rest,
          href,
          title,
        });
      }

      if (!url && href?.match(/^\//)) {
        const moduleRoute = isExternal ? '' : findModuleByLink(href, modules[rest.appId!]);
        const truncatedRoute = href.split('/').slice(0, 3).join('/');
        url = isExternal ? href : moduleRoute.length > truncatedRoute.length ? moduleRoute : truncatedRoute;
        appId = rest.appId ? rest.appId : appId;
      }
    });
  }

  return {
    ...rest,
    appId,
    isExternal,
    title,
    href: url,
    costLinks,
    subscriptionsLinks,
  };
}

const isDuplicate = (items: NavItem[], href?: string) => !!items.find((item) => item.href === href);

type AppFilterState = {
  isLoaded: boolean;
  isLoading: boolean;
  isOpen: boolean;
  filterValue: string;
  data: {
    [key: string]: AppFilterBucket;
  };
};

const useAppFilter = () => {
  const [state, setState] = useState<AppFilterState>({
    isLoaded: false,
    isLoading: false,
    isOpen: false,
    filterValue: '',
    data: {
      'cost-management': {
        id: 'cost-management',
        title: 'Cost Management',
        links: [],
      },
      subscriptions: {
        id: 'subscriptions',
        title: 'Subscriptions',
        links: [],
      },
    },
  });
  const visibleBundles = useVisibleBundles();
  const modules = useAtomValue(chromeModulesAtom);

  const handleBundleData = ({ id, navItems, title }: BundleNavigation) => {
    const links: (NavItem & {
      costLinks: NavItem[];
      subscriptionsLinks: NavItem[];
    })[] =
      navItems
        ?.reduce<(NavItem | NavItem[])[]>((acc, curr) => {
          if (curr.groupId && curr.navItems) {
            return [...acc, ...curr.navItems.map(({ groupId, navItems, ...rest }) => (groupId ? navItems || [] : (rest as unknown as NavItem)))];
          }
          return [...acc, curr];
        }, [])
        .flat()
        .map((link) => getBundleLink(link, modules || {}))
        .filter(({ filterable }) => filterable !== false) || [];
    const bundleLinks: NavItem[] = [];
    const extraLinks: { cost: NavItem[]; subs: NavItem[] } = {
      cost: [],
      subs: [],
    };
    links.forEach(({ costLinks, subscriptionsLinks, ...rest }) => {
      if (costLinks.length > 0) {
        extraLinks.cost.push(...costLinks.filter((item) => !item.isHidden));
      }

      if (subscriptionsLinks.length > 0) {
        extraLinks.subs.push(...subscriptionsLinks.filter((item) => !item.isHidden));
      }
      if (rest.filterable !== true && (subscriptionsLinks.length > 0 || costLinks.length > 0)) {
        return;
      }

      if (!rest.isHidden) {
        bundleLinks.push(rest);
      }
    });

    setState((prev) => ({
      ...prev,
      isLoaded: true,
      data: {
        ...prev.data,
        [id]: {
          id,
          title,
          links: bundleLinks,
        },
        'cost-management': {
          ...prev.data['cost-management'],
          links: [...prev.data['cost-management'].links, ...extraLinks.cost.filter((item) => !isDuplicate(prev.data['cost-management'].links, item.href))],
        },
        subscriptions: {
          ...prev.data.subscriptions,
          links: [...prev.data.subscriptions.links, ...extraLinks.subs.filter((item) => !isDuplicate(prev.data.subscriptions.links, item.href))],
        },
      },
    }));
  };

  useEffect(() => {
    if (state.isOpen && !state.isLoading && !state.isLoaded && visibleBundles.length > 0) {
      setState((prev) => ({
        ...prev,
        isLoading: true,
      }));
      visibleBundles.forEach(handleBundleData);
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [state.isOpen, visibleBundles, modules]);

  const setIsOpen = (isOpen: boolean) => {
    setState((prev) => ({
      ...prev,
      isOpen,
    }));
  };
  const setFilterValue = (filterValue = '') => {
    setState((prev) => ({
      ...prev,
      filterValue,
    }));
  };

  const filterApps = (data: { [key: string]: AppFilterBucket }, filterValue = '') =>
    Object.entries(data).reduce<{ [key: string]: AppFilterBucket }>((acc, [key, { links, ...rest }]) => {
      if (rest?.title?.toLowerCase().includes(filterValue.toLowerCase())) {
        return {
          ...acc,
          [key]: {
            ...rest,
            links,
          },
        };
      }
      return {
        ...acc,
        [key]: {
          ...rest,
          links: links.filter(({ title, isHidden }) => !isHidden && title?.toLowerCase().includes(filterValue.toLowerCase())),
        },
      };
    }, {});

  const filteredApps = filterApps(state.data, state.filterValue);
  return {
    ...state,
    setIsOpen,
    setFilterValue,
    filteredApps: bundlesOrder
      .map((app) => filteredApps[app])
      .filter((app) => typeof app !== 'undefined')
      .filter(({ links }) => links.length > 0),
  };
};

export default useAppFilter;

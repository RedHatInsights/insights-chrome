import { atom } from 'jotai';
import { NavItem, Navigation } from '../../@types/types.d';
import { highlightItems, levelArray } from '../../utils/common';

export type InternalNavigation = {
  [key: string]: Navigation;
};

type SetSegmentPayload = {
  segment: string;
  schema: Navigation;
  pathname?: string;
  shouldMerge?: boolean;
};

function isNavigation(nav?: Navigation | NavItem[]): nav is Navigation {
  return !Array.isArray(nav);
}

export const navigationAtom = atom<InternalNavigation>({});
export const setNavigationSegmentAtom = atom(null, (_get, set, { segment, schema, pathname, shouldMerge }: SetSegmentPayload) => {
  set(navigationAtom, (prev) => {
    const mergedSchema = shouldMerge || !prev[segment] ? schema : prev[segment];
    if (isNavigation(mergedSchema)) {
      const sortedLinks = levelArray(mergedSchema.navItems).sort((a, b) => (a.length < b.length ? 1 : -1));
      return {
        ...prev,
        [segment]: {
          ...mergedSchema,
          navItems: pathname ? highlightItems(pathname, mergedSchema.navItems, sortedLinks) : mergedSchema.navItems,
          sortedLinks,
        },
      };
    }
    return prev;
  });
});
export const getNavigationSegmentAtom = atom(null, (get, _set, segment: string) => {
  const navigation = get(navigationAtom);
  return navigation[segment];
});
export const getDynamicSegmentItemsAtom = atom(null, (get, _set, segment: string, dynamicNav: string) => {
  const navigation = get(navigationAtom);
  const nav = navigation[segment];
  return nav?.navItems?.filter((item) => item.dynamicNav === dynamicNav);
});

import { NavItem } from '../@types/types';

const filterNavItemsByTitle = (items: NavItem[], search: string): NavItem[] => {
  if (!search) return items;
  const lowerSearch = search.toLowerCase();

  return items
    .map((item) => {
      const matches = item.title?.toLowerCase().includes(lowerSearch);

      if (matches) {
        return item;
      }

      const filteredRoutes = item.routes ? filterNavItemsByTitle(item.routes, search) : [];
      const filteredNavItems = item.navItems ? filterNavItemsByTitle(item.navItems, search) : [];

      if (filteredRoutes.length > 0 || filteredNavItems.length > 0) {
        return {
          ...item,
          routes: filteredRoutes.length > 0 ? filteredRoutes : undefined,
          navItems: filteredNavItems.length > 0 ? filteredNavItems : undefined,
        };
      }

      return null;
    })
    .filter(Boolean) as NavItem[];
};

export default filterNavItemsByTitle;

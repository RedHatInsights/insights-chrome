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

      const filteredNavItems = item.navItems ? filterNavItemsByTitle(item.navItems, search) : [];

      if (filteredNavItems.length > 0) {
        return {
          ...item,
          navItems: filteredNavItems,
        };
      }

      return null;
    })
    .filter(Boolean) as NavItem[];
};

export default filterNavItemsByTitle;

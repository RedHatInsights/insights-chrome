import flatMap from 'lodash/flatMap';
import { NavItem, NavItemPermission } from '../@types/types';
import { getVisibilityFunctions } from './VisibilitySingleton';

const visibilityHandler = async ({ method, args }: NavItemPermission) => {
  const visibilityFunctions = getVisibilityFunctions();
  // (null, undefined, true) !== false
  if (!visibilityFunctions[method]) {
    return false;
  }
  return (await visibilityFunctions[method]?.(...(args || []))) !== false;
};

export const isNavItemVisible = (permissions: NavItemPermission | NavItemPermission[]) =>
  Promise.all(flatMap(Array.isArray(permissions) ? permissions : [permissions], visibilityHandler)).then((visibility) => visibility.every(Boolean));

export type ItemWithPermissionsConfig<T> = T & {
  permissions?: NavItemPermission | NavItemPermission[];
  isHidden?: boolean;
  groupId?: string;
  navItems?: ItemWithPermissionsConfig<NavItem>[];
  expandable?: boolean;
  routes?: ItemWithPermissionsConfig<NavItem>[];
};

export const evaluateVisibility = async <T>(navItem: ItemWithPermissionsConfig<T>) => {
  /**
   * Skip evaluation for hidden items
   */
  if (navItem.isHidden === true) {
    return navItem;
  }

  const result = {
    ...navItem,
    isHidden: false,
  };

  if (typeof result.permissions !== 'undefined') {
    const visible = await isNavItemVisible(result.permissions);
    /**
     * Hide item visibility check failed
     */
    if (!visible) {
      return {
        ...result,
        isHidden: true,
      };
    }
  }

  if (typeof result.groupId !== 'undefined') {
    /**
     * Evalute group items
     */
    result.navItems = await Promise.all(result.navItems!.map(evaluateVisibility));
  }

  if (result.expandable === true) {
    /**
     * Evaluate sub routes
     */
    result.routes = await Promise.all(result.routes!.map(evaluateVisibility));
  }

  return result;
};

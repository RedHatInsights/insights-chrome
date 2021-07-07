import flatMap from 'lodash/flatMap';
import { visibilityFunctions } from '../consts';

export const isNavItemVisible = (permissions) =>
  Promise.all(
    flatMap(
      Array.isArray(permissions) ? permissions : [permissions],
      async ({ method, args } = {}) =>
        // (null, undefined, true) !== false
        (await visibilityFunctions?.[method]?.(...(args || []))) !== false
    )
  ).then((visibility) => visibility.every(Boolean));

export const evaluateVisibility = async (navItem) => {
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
    result.navItems = await Promise.all(result.navItems.map(evaluateVisibility));
  }

  if (result.expandable === true) {
    /**
     * Evaluate sub routes
     */
    result.routes = await Promise.all(result.routes.map(evaluateVisibility));
  }

  return result;
};

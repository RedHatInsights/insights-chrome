import * as Sentry from '@sentry/react';
import { AnyNavItemPermission, NavItem } from '../@types/types';
import { getVisibilityFunctions } from './VisibilitySingleton';

export type VisibilityEvaluationContext = {
  source?: 'navigation' | 'service-tiles' | 'route' | 'search' | 'lightwell';
  bundleId?: string;
  itemId?: string;
  onError?: () => void;
};

const visibilityHandler = async ({ method, args }: AnyNavItemPermission, context: VisibilityEvaluationContext) => {
  try {
    const visibilityFunctions = getVisibilityFunctions();
    // (null, undefined, true) !== false
    if (!visibilityFunctions[method]) {
      return false;
    }
    return (await visibilityFunctions[method]?.(...(args || []))) !== false;
  } catch {
    // Do not attach the original error or arguments: API errors can contain
    // authorization headers, request payloads and other private data.
    Sentry.captureMessage('Visibility evaluation failed', {
      level: 'warning',
      tags: { area: 'visibility', source: context.source ?? 'unknown', bundleId: context.bundleId, itemId: context.itemId, method },
    });
    context.onError?.();
    return false;
  }
};

export const isNavItemVisible = (permissions: AnyNavItemPermission | AnyNavItemPermission[], context: VisibilityEvaluationContext = {}) =>
  Promise.all((Array.isArray(permissions) ? permissions : [permissions]).map((permission) => visibilityHandler(permission, context))).then((visibility) =>
    visibility.every(Boolean)
  );

export type ItemWithPermissionsConfig<T> = T & {
  id?: string;
  permissions?: AnyNavItemPermission | AnyNavItemPermission[];
  isHidden?: boolean;
  groupId?: string;
  navItems?: ItemWithPermissionsConfig<NavItem>[];
  expandable?: boolean;
};

export const evaluateVisibility = async <T>(navItem: ItemWithPermissionsConfig<T>, context: VisibilityEvaluationContext = {}) => {
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
    const visible = await isNavItemVisible(result.permissions, { ...context, itemId: result.id ?? result.groupId ?? context.itemId });
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

  if (Array.isArray(result.navItems)) {
    result.navItems = await Promise.all(result.navItems.map((item) => evaluateVisibility(item, context)));
  }

  return result;
};

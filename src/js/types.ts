/**
 * @deprecated
 * Only use as placeholder
 */
export type AnyObject = {
  [key: string]: any;
};

/**
 * TODO: Move to the component once it is migrated to TS
 */
export type NavItem = {
  href?: string;
  routes?: NavItem[];
  navItems?: NavItem[];
  active?: boolean;
};

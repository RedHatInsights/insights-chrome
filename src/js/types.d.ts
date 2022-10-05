import { ChromeAPI, VisibilityFunctions } from '@redhat-cloud-services/types';
import { AnalyticsBrowser } from '@segment/analytics-next';
/**
 * @deprecated
 * Only use as placeholder
 */
export type AnyObject = {
  [key: string]: any;
};

export type NavItemPermission<T extends keyof VisibilityFunctions = 'isOrgAdmin'> = {
  method: T;
  args: Parameters<VisibilityFunctions[T]>;
};

/**
 * TODO: Move to the component once it is migrated to TS
 */
export type NavItem = {
  groupId?: string;
  expandable?: boolean;
  href?: string;
  routes?: NavItem[];
  navItems?: NavItem[];
  active?: boolean;
  isHidden?: boolean;
  permissions?: NavItemPermission[] | NavItemPermission;
};

declare global {
  interface Window {
    sendCustomEvent: (event: string) => void;
    insights: {
      chrome: ChromeAPI;
    };
    segment?: AnalyticsBrowser;
    _segment?: {
      activeModule?: string;
      groupId?: string;
      pageOptions?: Record<string, unknown>;
    };
    s?: {
      visitor?: {
        getMarketingCloudVisitorID: () => string;
      };
    };
  }
}

export type ChromeAuthOptions = {
  realm: string;
  clientId: string;
  cookieName: string;
  refreshToken?: string;
  token?: string;
};

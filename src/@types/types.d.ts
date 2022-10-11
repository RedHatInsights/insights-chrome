import { QuickStart, QuickStartCatalogPage } from '@patternfly/quickstarts';
import { VisibilityFunctions } from '@redhat-cloud-services/types';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { AddHelpTopic, DisableTopics, EnableTopics } from '../components/QuickStart/useHelpTopicState';
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
  filterable?: boolean;
  isExternal?: boolean;
  isFedramp?: boolean;
  title?: string;
  appId?: string;
  groupId?: string;
  expandable?: boolean;
  href?: string;
  routes?: NavItem[];
  navItems?: NavItem[];
  active?: boolean;
  isHidden?: boolean;
  permissions?: NavItemPermission[] | NavItemPermission;
  dynamicNav?: string;
};

export type BundleNavigation = {
  id: string;
  title: string;
  navItems: NavItem[];
};

declare global {
  interface Window {
    hj: any;
    pendo?: {
      updateOptions: (...args: any[]) => void;
      initialize: (config: Record<string, any>) => void;
    };
    sendCustomEvent: (event: string) => void;
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
    _satellite?: {
      pageBottom?: () => void;
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

export type HelpTopicsAPI = {
  addHelpTopics: AddHelpTopic;
  disableTopics: DisableTopics;
  enableTopics: EnableTopics;
};

export type QuickstartsApi = {
  version: number;
  updateQuickStarts: (key: string, quickstarts: QuickStart[]) => void;
  toggle: (quickstart: string) => void;
  Catalog: typeof QuickStartCatalogPage;
};

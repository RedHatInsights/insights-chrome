import { QuickStart, QuickStartCatalogPage } from '@patternfly/quickstarts';
import { VisibilityFunctions } from '@redhat-cloud-services/types';
import { AnalyticsBrowser } from '@segment/analytics-next';
import type { Group, GroupFilterItem } from '@redhat-cloud-services/frontend-components/ConditionalFilter';
import type Intercom from '@types/intercom-web';

import { AddHelpTopic, DisableTopics, EnableTopics } from '../components/QuickStart/useHelpTopicState';

// TODO: Update once navigation is mgrated to TS
export type Navigation = {
  id?: string;
  title?: string;
  navItems: NavItem[];
  sortedLinks: string[];
};

export type NavDOMEvent = {
  href: string;
  id: string;
  navId: string;
  type: string;
  target?: HTMLAnchorElement | null;
};

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
      flushNow: () => void;
      setGuidesDisabled: (disabled: boolean) => void;
      stopGuides: () => void;
      stopSendingEvents: () => void;
    };
    Intercom: Intercom;
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
  set: (key: string, quickstarts: QuickStart[]) => void;
  toggle: (quickstart: string) => void;
  Catalog: typeof QuickStartCatalogPage;
};

export type AppNavigationCB = (navEvent: { navId?: string; domEvent: NavDOMEvent }) => void;
export type GenericCB = (...args: unknown[]) => void;

export type RouteDefinition = {
  absolute?: boolean;
  appId?: string;
  href?: string;
  scope: string;
  module: string;
  isFedramp?: boolean;
  path: string;
  manifestLocation: string;
  dynamic?: boolean;
  exact?: boolean;
};

export type ModuleRoute =
  | {
      isFedramp?: boolean;
      pathname: string;
      exact?: boolean;
      dynamic?: boolean;
    }
  | string;

export type RemoteModule = {
  module: string;
  routes: ModuleRoute[];
};

export type ChromeModule = {
  manifestLocation: string;
  ssoUrl?: string;
  config?: {
    ssoUrl?: string;
    fullProfile?: boolean;
  };
  analytics?: {
    APIKey?: string;
  };
  dynamic?: boolean;
  isFedramp?: boolean;
  modules?: RemoteModule[];
  defaultDocumentTitle?: string;
  fullProfile?: boolean;
};

export interface GroupItem {
  /** Optional isSelected flag */
  isSelected?: boolean;
  /** Reference back to the group */
  group: Group;
  /** Current group filter item */
  item: GroupFilterItem;
}

export type FlagTagsFilter = Record<string, Record<string, boolean | GroupItem>>;

export type ChromeNavItemProps = {
  isHidden?: boolean;
  ignoreCase?: boolean;
  title?: string;
  isExternal?: boolean;
  isBeta?: boolean;
  href: string;
  className?: string;
  active?: boolean;
  appId: string;
  notifier?: string;
  product?: string;
};

export type ChromeNavExapandableProps = {
  title: string;
  routes: RouteDefinition[];
  active?: boolean;
  isHidden?: boolean;
  id?: string;
};

export type ChromeNavGroupProps = {
  navItems: NavItem[];
  isHidden?: boolean;
  icon?: 'wrench' | 'shield' | 'database' | 'cloud' | 'code' | 'trend-up';
  title: string;
};

export type DynamicNavProps = ChromeNavItemProps & {
  dynamicNav: string;
  useNavigation: (config: {
    schema?: Navigation | NavItem[];
    dynamicNav: string;
    currentNamespace: string;
    currNav?: NavItem[];
  }) => NavItem | NavItem[];
  pathname: string;
};

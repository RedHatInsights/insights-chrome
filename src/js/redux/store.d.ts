import { QuickStart } from '@patternfly/quickstarts';
import { ChromeUser } from '@redhat-cloud-services/types';
import { NavItem } from '../types';

export type ChromeModule = {
  manifestLocation: string;
  analytics?: {
    APIKey?: string;
  };
};

// TODO: Update once navigation is mgrated to TS
export type Navigation = {
  navItems: NavItem[];
  sortedLinks: string[];
};

type InternalNavigation = {
  [key: string]: Navigation | NavItem[] | undefined;
  landingPage?: NavItem[];
};

export type AccessRequest = { request_id: string; created: string; seen: boolean };

export type ChromeState = {
  contextSwitcherOpen: boolean;
  activeApp?: string;
  activeModule?: string;
  /**
   * @deprecated
   * App id is replaced by active module. It is still required until we completely remove usage of main.yml
   */
  appId?: string;
  missingIDP?: boolean;
  user?: ChromeUser;
  pageAction?: string;
  pageObjectId?: string;
  modules?: { [key: string]: ChromeModule };
  navigation: InternalNavigation;
  scalprumConfig?: {
    [key: string]: {
      name: string;
      manifestLocation: string;
      module?: string;
    };
  };
  usePendoFeedback?: boolean;
  isFeedbackModalOpen?: boolean;
  accessRequests: {
    count: number;
    data: AccessRequest[];
    hasUnseen: boolean;
  };
  initialHash?: string;
  quickstarts: {
    disabled?: boolean;
    quickstarts: {
      [key: string]: QuickStart[];
    };
  };
  documentTitle?: string;
};

export type GlobalFilterWorkloads = {
  isLoaded: boolean;
  hasSap?: number;
  hasAap?: number;
  hasMssql?: number;
  items?: any[];
  count?: number;
  total?: number;
};

export type GlobalFilterSIDs = {
  isLoaded: boolean;
  total?: number;
  count?: number;
  page?: number;
  perPage?: number;
  items?: any[];
};

export type GlobalFilterTag = {
  name: string;
  tags: unknown;
};

export type GlobalFilterTags = {
  isLoaded: boolean;
  items: GlobalFilterTag[];
  total?: number;
  count?: number;
  page?: number;
  perPage?: number;
};

export type GlobalFilterState = {
  tags: GlobalFilterTags;
  globalFilterRemoved?: boolean;
  workloads: GlobalFilterWorkloads;
  sid: GlobalFilterSIDs;
  selectedTags?: unknown;
  globalFilterHidden: boolean;
  scope?: string;
};

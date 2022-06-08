import { ChromeAPI } from '@redhat-cloud-services/types';
import { AnalyticsBrowser } from '@segment/analytics-next';
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

declare global {
  interface Window {
    sendCustomEvent: (event: string) => void;
    insights: {
      chrome: ChromeAPI;
    };
    segment?: AnalyticsBrowser;
  }
}

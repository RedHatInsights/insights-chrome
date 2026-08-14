import chromeStore from '../state/chromeStore';
import { setUserPersonalizationDegradedAtom } from '../state/atoms/degradedStateAtom';

const functionBuilder = (key: string, value: boolean | number | string) => {
  if (window.localStorage) {
    window.localStorage.setItem(key, value.toString());
  }
  return () => window.localStorage && window.localStorage.removeItem(key);
};

const debugFunctions = {
  iqe: () => functionBuilder('iqe:chrome:init', true),
  remediationsDebug: () => functionBuilder('remediations:debug', true),
  invTags: () => functionBuilder('rhcs-tags', true),
  shortSession: () => functionBuilder('chrome:jwt:shortSession', true),
  jwtDebug: () => functionBuilder('chrome:auth:debug', true),
  reduxDebug: () => () => {}, // No-op function for compatibility with external types
  forcePendo: () => functionBuilder('forcePendo', true),
  disableSegment: () => functionBuilder('chrome:segment:disable', true),
  disableAnalytics: () => functionBuilder('chrome:analytics:disable', true),
  allDetails: () => functionBuilder('chrome:inventory:experimental_detail', true),
  inventoryDrawer: () => functionBuilder('chrome:inventory:experimental_drawer', true),
  globalFilter: () => functionBuilder('chrome:experimental:global-filter', true),
  appFilter: () => functionBuilder('chrome:experimental:app-filter', true),
  contextSwitcher: () => functionBuilder('chrome:experimental:context-switcher', true),
  quickstartsDebug: () => functionBuilder('chrome:experimental:quickstarts', true),
  darkMode: () => functionBuilder('chrome:darkmode', true),
  segmentDev: () => functionBuilder('chrome:analytics:dev', true),
  intlDebug: () => functionBuilder('chrome:intl:debug', true),
  sentryDebug: () => functionBuilder('chrome:sentry:debug', true),
  degradedStateBanner: () => {
    chromeStore.set(setUserPersonalizationDegradedAtom, true);
    console.log('✓ Degraded state banner triggered (user personalization degraded)');
    return () => {
      chromeStore.set(setUserPersonalizationDegradedAtom, false);
      console.log('✓ Degraded state banner cleared');
    };
  },
};

export default debugFunctions;

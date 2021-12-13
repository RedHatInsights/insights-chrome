const functionBuilder = (key, value) => {
  window.localStorage && window.localStorage.setItem(key, value);
  return () => window.localStorage && window.localStorage.removeItem(key);
};

export default {
  iqe: () => functionBuilder('iqe:chrome:init', true),
  remediationsDebug: () => functionBuilder('remediations:debug', true),
  invTags: () => functionBuilder('rhcs-tags', true),
  shortSession: () => functionBuilder('chrome:jwt:shortSession', true),
  jwtDebug: () => functionBuilder('chrome:jwt:debug', true),
  reduxDebug: () => functionBuilder('chrome:redux:debug', true),
  forcePendo: () => functionBuilder('forcePendo', true),
  allDetails: () => functionBuilder('chrome:inventory:experimental_detail', true),
  inventoryDrawer: () => functionBuilder('chrome:inventory:experimental_drawer', true),
  globalFilter: () => functionBuilder('chrome:experimental:global-filter', true),
  appFilter: () => functionBuilder('chrome:experimental:app-filter', true),
  contextSwitcher: () => functionBuilder('chrome:experimental:context-switcher', true),
  quickstartsDebug: () => functionBuilder('chrome:experimental:quickstarts', true),
};

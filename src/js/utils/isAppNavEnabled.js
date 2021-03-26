import { getEnv, isBeta } from '../utils';

export const isFilterEnabled =
  localStorage.getItem('chrome:experimental:app-filter') === 'true' || (['ci', 'qa', 'stage'].includes(getEnv()) && isBeta());

export const isContextSwitcherEnabled = localStorage.getItem('chrome:experimental:context-switcher') === 'true' || (getEnv() === 'ci' && isBeta());

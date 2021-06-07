import { getEnv, isBeta } from '../utils';

export const isContextSwitcherEnabled = localStorage.getItem('chrome:experimental:context-switcher') === 'true' || (getEnv() === 'ci' && isBeta());

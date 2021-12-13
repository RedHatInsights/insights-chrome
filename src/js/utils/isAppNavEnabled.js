import { getEnv, isBeta } from '../utils';

const env = getEnv();
const isBetaEnv = isBeta();

export const isContextSwitcherEnabled =
  localStorage.getItem('chrome:experimental:context-switcher') === 'true' || (isBetaEnv && ['ci', 'qa', 'stage'].includes(env));

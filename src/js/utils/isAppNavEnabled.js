import { getEnv, isBeta } from '../utils';

export const isFilterEnabled = localStorage.getItem('chrome:experimental:app-filter') === 'true' || (getEnv() === 'ci' && isBeta());

import * as productTrialFlagUtils from './isProductTrialFlagActive';

export const ANSIBLE_TRIAL_FLAG = 'ansible';

export const isAnsibleTrialFlagActive = () => productTrialFlagUtils.isProductTrialFlagActive(ANSIBLE_TRIAL_FLAG);

export const setAnsibleTrialFlag = () => productTrialFlagUtils.setProductTrialFlag(ANSIBLE_TRIAL_FLAG);

export const clearAnsibleTrialFlag = () => productTrialFlagUtils.clearProductTrialFlag(ANSIBLE_TRIAL_FLAG);

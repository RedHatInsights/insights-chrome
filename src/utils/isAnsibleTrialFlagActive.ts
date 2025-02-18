import logger from '../auth/logger';

// This is needed to "fake" the is_trial entitlement until the backend service catches up. There might be a delay between the activation up to 10 minutes.
export const ANSIBLE_TRIAL_FLAG = 'chrome.ansible.trial';
const TRIAL_DURATION = 10 * 60 * 1000; // 10 minutes

const log = logger('Ansible trial invalidation');

export const isAnsibleTrialFlagActive = () => {
  let expiration: string | number | null = localStorage.getItem(ANSIBLE_TRIAL_FLAG);
  if (expiration) {
    try {
      expiration = parseInt(expiration);
      if (isNaN(expiration)) {
        // expiration is not a valid number
        return false;
      }

      return expiration + TRIAL_DURATION > Date.now();
    } catch (error) {
      log(`Enable to parse ansible trial flag expiration: ${error}`);
    }
  }

  return false;
};

export const setAnsibleTrialFlag = () => {
  localStorage.setItem(ANSIBLE_TRIAL_FLAG, Date.now().toString());
};

export const clearAnsibleTrialFlag = () => {
  localStorage.removeItem(ANSIBLE_TRIAL_FLAG);
};

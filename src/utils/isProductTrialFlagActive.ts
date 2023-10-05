import logger from '../jwt/logger';

const TRIAL_DURATION = 10 * 60 * 1000; // 10 minutes

const log = logger('Product trial invalidation');

export const isProductTrialFlagActive = (flag: string) => {
  let expiration: string | number | null = localStorage.getItem(`chrome.${flag}.trial`);
  if (expiration) {
    try {
      expiration = parseInt(expiration);
      if (isNaN(expiration)) {
        // expiration is not a valid number
        return false;
      }

      return expiration + TRIAL_DURATION > Date.now();
    } catch (error) {
      log(`Unable to parse ${flag} trial expiration: ${error}`);
    }
  }
};

/**
 * Sets a product trial flag to the current date/time in localstorage
 * @param flag string representation of the product this flag pertains to. This exact string should appear in the URL path of the product being enable
 */
export const setProductTrialFlag = (flag: string) => {
  localStorage.setItem(`chrome.${flag}.trial`, Date.now().toString());
};

export const clearProductTrialFlag = (flag: string) => {
  localStorage.removeItem(`chrome.${flag}.trial`);
};

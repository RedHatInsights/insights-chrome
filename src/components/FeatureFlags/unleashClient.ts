import { UnleashClient } from '@unleash/proxy-client-react';

let unleashClient: UnleashClient;

export const UNLEASH_ERROR_KEY = 'chrome:feature-flags:error';

/**
 * Clear error localstorage flag before initialization
 */
localStorage.setItem(UNLEASH_ERROR_KEY, 'false');

export const getFeatureFlagsError = () => localStorage.getItem(UNLEASH_ERROR_KEY) === 'true';

export function getUnleashClient() {
  if (!unleashClient) {
    throw new Error('UnleashClient not initialized!');
  }
  return unleashClient;
}

export function setUnleashClient(client: UnleashClient) {
  unleashClient = client;
}

export function unleashClientExists() {
  return !!unleashClient;
}

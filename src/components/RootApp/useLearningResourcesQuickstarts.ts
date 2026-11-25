import { useFlag } from '@unleash/proxy-client-react';

export const LEARNING_RESOURCES_QUICKSTARTS_FLAG = 'platform.chrome.learning-resources-quickstarts';
export const LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY = 'chrome:experimental:lr-quickstarts';

export function useLearningResourcesQuickstarts() {
  const fromUnleash = useFlag(LEARNING_RESOURCES_QUICKSTARTS_FLAG);
  try {
    const fromLocal = window.localStorage?.getItem(LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY) === 'true';
    return Boolean(fromUnleash || fromLocal);
  } catch {
    return Boolean(fromUnleash);
  }
}

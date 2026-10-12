import * as Sentry from '@sentry/react';

export const isExperimentalQuickstartsEnabled = (): boolean => {
  try {
    return localStorage.getItem('chrome:experimental:quickstarts') === 'true';
  } catch {
    // This optional setting must not prevent navigation or routes from rendering.
    // Do not attach the storage error: it may contain private browser data.
    Sentry.captureMessage('Unable to read experimental quickstarts setting', {
      level: 'warning',
      tags: { area: 'navigation', itemId: 'experimental-quickstarts' },
    });
    return false;
  }
};

import type { ChromeUser } from '@redhat-cloud-services/types';
import { getAnalyticsUserId } from './getAnalyticsUserId';

describe('getAnalyticsUserId', () => {
  it('returns the internal account ID', () => {
    const user = { identity: { internal: { account_id: 'account-123' } } } as ChromeUser;

    expect(getAnalyticsUserId(user)).toBe('account-123');
  });

  it('returns undefined when the internal account ID is unavailable', () => {
    const user = { identity: {} } as ChromeUser;

    expect(getAnalyticsUserId(user)).toBeUndefined();
  });
});

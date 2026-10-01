import * as Sentry from '@sentry/react';
import { isExperimentalQuickstartsEnabled } from './isExperimentalQuickstartsEnabled';

jest.mock('@sentry/react', () => ({ captureMessage: jest.fn() }));

describe('isExperimentalQuickstartsEnabled', () => {
  const key = 'chrome:experimental:quickstarts';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem(key);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.removeItem(key);
  });

  it.each([null, 'false', '1', 'true'])('only enables the catalog for the stored string true (value=%s)', (value) => {
    if (value !== null) localStorage.setItem(key, value);

    expect(isExperimentalQuickstartsEnabled()).toBe(value === 'true');
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('disables only the optional catalog when storage throws and retries on the next read', () => {
    localStorage.setItem(key, 'true');
    jest.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('private storage data', 'SecurityError');
    });

    expect(isExperimentalQuickstartsEnabled()).toBe(false);
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Unable to read experimental quickstarts setting', {
      level: 'warning',
      tags: { area: 'navigation', itemId: 'experimental-quickstarts' },
    });
    expect(JSON.stringify(jest.mocked(Sentry.captureMessage).mock.calls)).not.toContain('private storage data');
    expect(isExperimentalQuickstartsEnabled()).toBe(true);
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
  });
});

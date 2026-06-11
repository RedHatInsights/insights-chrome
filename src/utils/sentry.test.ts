import type { Event } from '@sentry/react';
import * as Sentry from '@sentry/react';
import { filterAdobeAlloySentryEvent, getAppDetails, isAdobeAlloyError, recordAdobeAlloyError, resetAdobeAlloyErrorTracking } from './sentry';

jest.mock('@sentry/react', () => ({
  ...jest.requireActual('@sentry/react'),
  captureMessage: jest.fn(),
}));

const captureMessageMock = Sentry.captureMessage as jest.MockedFunction<typeof Sentry.captureMessage>;

const adobeAlloyEvent = (message = 'TypeError: [alloy] sendEvent failed'): Event => ({
  message,
});

describe('getAppDetails function', () => {
  afterEach(() => {
    jsdomReset();
  });

  it('should return insights and dashboard for /insights/dashboard', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/insights/dashboard' });

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('dashboard');
  });

  it('should return insights and inventory for /insights/inventory', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/insights/inventory' });

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('inventory');
  });

  it('should return insights and registration for /insights/registration', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/insights/registration' });

    const result = getAppDetails();
    expect(result.app.group).toBe('insights');
    expect(result.app.name).toBe('registration');
  });

  it('should return openshift and vulnerability for /openshift/insights/vulnerability/', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/openshift/insights/vulnerability/cves' });

    const result = getAppDetails();
    expect(result.app.group).toBe('openshift');
    expect(result.app.name).toBe('vulnerability');
  });

  it('should return openshift and advisor for /openshift/insights/advisor/', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/openshift/insights/advisor/recommendations' });

    const result = getAppDetails();
    expect(result.app.group).toBe('openshift');
    expect(result.app.name).toBe('advisor');
  });
});

describe('isAdobeAlloyError function', () => {
  it('should detect Adobe Alloy errors by [alloy] message pattern', () => {
    const event: Event = {
      message: 'TypeError: [alloy] [DataCollector] An error occurred while executing the sendEvent command.',
    };

    expect(isAdobeAlloyError(event)).toBe(true);
  });

  it('should detect Adobe Alloy errors by [DataCollector] message pattern', () => {
    const event: Event = {
      exception: {
        values: [
          {
            value: '[DataCollector] An error occurred while executing the sendEvent command.',
          },
        ],
      },
    };

    expect(isAdobeAlloyError(event)).toBe(true);
  });

  it('should detect Adobe Alloy errors by smetrics.redhat.com in message', () => {
    const event: Event = {
      message: 'TypeError: Failed to fetch (smetrics.redhat.com)',
    };

    expect(isAdobeAlloyError(event)).toBe(true);
  });

  it('should detect Adobe Alloy errors by /ma/dpal.js in stack trace', () => {
    const event: Event = {
      exception: {
        values: [
          {
            value: 'Some error',
            stacktrace: {
              frames: [
                {
                  filename: 'https://www.redhat.com/ma/dpal.js',
                  function: 'someFunction',
                  lineno: 123,
                },
                {
                  filename: '/apps/chrome/js/bundle.js',
                  function: 'anotherFunction',
                  lineno: 456,
                },
              ],
            },
          },
        ],
      },
    };

    expect(isAdobeAlloyError(event)).toBe(true);
  });

  it('should NOT detect non-Adobe errors', () => {
    const event: Event = {
      message: 'TypeError: Cannot read property of undefined',
      exception: {
        values: [
          {
            value: 'TypeError: Cannot read property of undefined',
            stacktrace: {
              frames: [
                {
                  filename: '/apps/chrome/js/bundle.js',
                  function: 'myFunction',
                  lineno: 123,
                },
              ],
            },
          },
        ],
      },
    };

    expect(isAdobeAlloyError(event)).toBe(false);
  });

  it('should NOT detect errors with similar but different patterns', () => {
    const event: Event = {
      message: 'Error in alloywheel component',
    };

    expect(isAdobeAlloyError(event)).toBe(false);
  });

  it('should handle events with no message or exception', () => {
    const event: Event = {};

    expect(isAdobeAlloyError(event)).toBe(false);
  });

  it('should handle events with empty exception values', () => {
    const event: Event = {
      exception: {
        values: [],
      },
    };

    expect(isAdobeAlloyError(event)).toBe(false);
  });

  it('should detect Adobe errors in exception value when message is missing', () => {
    const event: Event = {
      exception: {
        values: [
          {
            value: 'Network request failed. Caused by: Failed to fetch (smetrics.redhat.com)',
          },
        ],
      },
    };

    expect(isAdobeAlloyError(event)).toBe(true);
  });
});

describe('recordAdobeAlloyError function', () => {
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  afterEach(() => {
    resetAdobeAlloyErrorTracking();
  });

  it('should count errors within a rolling 5-minute window', () => {
    const baseTime = Date.now();

    for (let i = 0; i < 49; i++) {
      expect(recordAdobeAlloyError(baseTime + i)).toBe(i + 1);
    }
    expect(recordAdobeAlloyError(baseTime + 49)).toBe(50);
  });

  it('should prune timestamps older than 5 minutes on each record', () => {
    const baseTime = Date.now();

    recordAdobeAlloyError(baseTime);
    recordAdobeAlloyError(baseTime + FIVE_MINUTES_MS - 1);
    expect(recordAdobeAlloyError(baseTime + FIVE_MINUTES_MS + 1)).toBe(2);
  });

  it('should not accumulate slow-but-steady errors across long gaps', () => {
    const baseTime = Date.now();

    for (let i = 0; i < 49; i++) {
      recordAdobeAlloyError(baseTime + i * (FIVE_MINUTES_MS + 1));
    }
    expect(recordAdobeAlloyError(baseTime + 49 * (FIVE_MINUTES_MS + 1))).toBe(1);
  });
});

describe('filterAdobeAlloySentryEvent function', () => {
  const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);

  afterEach(() => {
    resetAdobeAlloyErrorTracking();
    captureMessageMock.mockClear();
    debugSpy.mockClear();
  });

  afterAll(() => {
    debugSpy.mockRestore();
  });

  it('should pass through non-Adobe events unchanged', () => {
    const event: Event = { message: 'TypeError: Cannot read property of undefined' };

    expect(filterAdobeAlloySentryEvent(event)).toBe(event);
    expect(captureMessageMock).not.toHaveBeenCalled();
  });

  it('should drop Adobe Alloy events before the burst threshold', () => {
    const event = adobeAlloyEvent();

    expect(filterAdobeAlloySentryEvent(event)).toBeNull();
    expect(captureMessageMock).not.toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalledWith('Adobe Analytics error (count: 1):', event.message);
  });

  it('should emit a warning and reset tracking when the rolling window hits the threshold', () => {
    const thresholdEvent = adobeAlloyEvent('TypeError: [alloy] burst threshold reached');

    for (let i = 0; i < 49; i++) {
      expect(filterAdobeAlloySentryEvent(adobeAlloyEvent(`[alloy] error ${i}`))).toBeNull();
    }

    expect(filterAdobeAlloySentryEvent(thresholdEvent)).toBeNull();
    expect(captureMessageMock).toHaveBeenCalledTimes(1);
    expect(captureMessageMock).toHaveBeenCalledWith('Adobe Analytics may be completely broken', {
      level: 'warning',
      extra: {
        consecutiveErrors: 50,
        timeWindow: '5 minutes',
        originalError: thresholdEvent.message,
        threshold: 50,
      },
    });
  });

  it('should allow a new burst alert after tracking resets at the threshold', () => {
    for (let i = 0; i < 50; i++) {
      filterAdobeAlloySentryEvent(adobeAlloyEvent(`[alloy] first burst ${i}`));
    }
    captureMessageMock.mockClear();

    filterAdobeAlloySentryEvent(adobeAlloyEvent('[alloy] below threshold'));
    expect(captureMessageMock).not.toHaveBeenCalled();

    for (let i = 0; i < 50; i++) {
      filterAdobeAlloySentryEvent(adobeAlloyEvent(`[alloy] second burst ${i}`));
    }

    expect(captureMessageMock).toHaveBeenCalledTimes(1);
  });
});

import { reportConfigSource, resetConfigCacheStatus, subscribeConfigCacheStatus } from './configCacheStatus';

describe('config cache status', () => {
  let unsubscribeListeners: Array<() => void> = [];

  beforeEach(() => {
    resetConfigCacheStatus();
    unsubscribeListeners = [];
  });

  afterEach(() => {
    unsubscribeListeners.forEach((unsubscribe) => unsubscribe());
    resetConfigCacheStatus();
  });

  const subscribeForTest = (listener: (degraded: boolean) => void) => {
    const unsubscribe = subscribeConfigCacheStatus(listener);
    unsubscribeListeners.push(unsubscribe);
    return unsubscribe;
  };

  it('replays a cache hit that happened before subscription', () => {
    reportConfigSource('sso-config-generated', true);
    const listener = jest.fn();

    subscribeForTest(listener);

    expect(listener).toHaveBeenCalledWith(true);
  });

  it('aggregates cached sources and only recovers after all sources are live', () => {
    const listener = jest.fn();
    subscribeForTest(listener);
    listener.mockClear();

    reportConfigSource('sso-config-generated', true);
    reportConfigSource('fed-modules-generated', true);
    reportConfigSource('sso-config-generated', false);

    expect(listener).toHaveBeenNthCalledWith(1, true);
    expect(listener).toHaveBeenCalledTimes(1);

    reportConfigSource('fed-modules-generated', false);

    expect(listener).toHaveBeenNthCalledWith(2, false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('stops notifying an unsubscribed listener', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeForTest(listener);
    listener.mockClear();

    unsubscribe();
    reportConfigSource('bundles-generated', true);

    expect(listener).not.toHaveBeenCalled();
  });
});

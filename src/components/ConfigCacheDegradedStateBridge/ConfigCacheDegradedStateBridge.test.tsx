import { render } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { degradedStateAtom } from '../../state/atoms/degradedStateAtom';
import { reportConfigSource, resetConfigCacheStatus } from '../../utils/configCacheStatus';
import ConfigCacheDegradedStateBridge from './ConfigCacheDegradedStateBridge';

describe('ConfigCacheDegradedStateBridge', () => {
  beforeEach(() => {
    resetConfigCacheStatus();
  });

  it('replays cached config state into the Jotai store on mount', () => {
    reportConfigSource('sso-config-generated', true);
    const store = createStore();

    render(
      <Provider store={store}>
        <ConfigCacheDegradedStateBridge />
      </Provider>
    );

    expect(store.get(degradedStateAtom).configFromCache).toBe(true);
  });

  it('removes its subscription on unmount', () => {
    const store = createStore();
    const { unmount } = render(
      <Provider store={store}>
        <ConfigCacheDegradedStateBridge />
      </Provider>
    );

    reportConfigSource('fed-modules-generated', true);
    expect(store.get(degradedStateAtom).configFromCache).toBe(true);

    unmount();
    reportConfigSource('fed-modules-generated', false);

    expect(store.get(degradedStateAtom).configFromCache).toBe(true);
  });
});

import React from 'react';
import { render } from '@testing-library/react';
import { SILENT_REAUTH_ENABLED_KEY } from '../../utils/consts';
import { getUnleashClient } from './unleashClient';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { getDefaultStore } from 'jotai';
import { silentReauthEnabledAtom } from '../../state/atoms/silentReauthAtom';

// Mock the Unleash react client to control the underlying client instance and events
jest.mock('@unleash/proxy-client-react', () => {
  class FakeUnleashClient {
    // simple event bus
    private handlers: Record<string, Array<() => void>> = {};
    public isEnabledReturn = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_config: any) {}
    on(event: string, cb: () => void) {
      if (!this.handlers[event]) {
        this.handlers[event] = [];
      }
      this.handlers[event].push(cb);
    }
    // helper for tests
    emit(event: string) {
      (this.handlers[event] || []).forEach((cb) => cb());
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isEnabled(_flagName: string) {
      return this.isEnabledReturn;
    }
  }
  const FlagProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  return { UnleashClient: FakeUnleashClient, FlagProvider };
});

// Import after mocks so the provider uses the mocked UnleashClient
import FeatureFlagsProvider from './FeatureFlagsProvider';

describe('FeatureFlagsProvider - syncLocalStorage', () => {
  let authValue: any;
  const renderProvider = () =>
    render(
      <ChromeAuthContext.Provider value={authValue}>
        <FeatureFlagsProvider>
          <div>child</div>
        </FeatureFlagsProvider>
      </ChromeAuthContext.Provider>
    );
  beforeEach(() => {
    localStorage.removeItem(SILENT_REAUTH_ENABLED_KEY);
    authValue = {
      // minimal fields used by FeatureFlagsProvider
      user: {
        entitlements: {},
        identity: {
          account_number: '123',
          internal: { account_id: 'acc-1', org_id: 'org-1' },
          user: { email: 'a@b.com' },
        },
      },
    } as any;
  });

  it('writes true to localStorage on ready when flag enabled', () => {
    renderProvider();
    const client: any = getUnleashClient();
    client.isEnabledReturn = true;
    client.emit('ready');
    expect(localStorage.getItem(SILENT_REAUTH_ENABLED_KEY)).toBe('true');
    expect(getDefaultStore().get(silentReauthEnabledAtom)).toBe(true);
  });

  it('updates localStorage on update when flag disabled', () => {
    renderProvider();
    const client: any = getUnleashClient();
    client.isEnabledReturn = false;
    client.emit('update');
    expect(localStorage.getItem(SILENT_REAUTH_ENABLED_KEY)).toBe('false');
    expect(getDefaultStore().get(silentReauthEnabledAtom)).toBe(false);
  });

  it('forces false to localStorage on error', () => {
    renderProvider();
    const client: any = getUnleashClient();
    client.isEnabledReturn = true;
    client.emit('error');
    expect(localStorage.getItem(SILENT_REAUTH_ENABLED_KEY)).toBe('false');
    expect(getDefaultStore().get(silentReauthEnabledAtom)).toBe(false);
  });
});

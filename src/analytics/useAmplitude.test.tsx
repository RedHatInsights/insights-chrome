import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useAtomValue } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';

jest.mock('@unleash/proxy-client-react', () => ({ useFlag: jest.fn(() => true) }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../utils/common', () => ({ isProd: () => false }));
jest.mock('../state/atoms/activeModuleAtom', () => ({
  activeModuleDefinitionReadAtom: {},
}));
jest.mock('jotai', () => ({ useAtomValue: jest.fn(() => ({ analytics: { amplitude: { APIKeyDev: 'DEVKEY' } } })) }));
jest.mock('./useSegment', () => ({ useSegment: () => ({ analytics: analyticsMock, ready: true }) }));

const onHandlers: Record<string, Array<(...args: unknown[]) => void>> = {};
const analyticsMock = {
  ready: (cb: () => void) => cb(),
  user: () =>
    Promise.resolve({
      id: () => 'user-1',
      anonymousId: () => 'anon-1',
    }),
  track: jest.fn(),
  on: (event: string, handler: (...args: unknown[]) => void) => {
    onHandlers[event] = onHandlers[event] || [];
    onHandlers[event].push(handler);
  },
  off: jest.fn(),
};

import useAmplitude from './useAmplitude';

function TestComponent() {
  useAmplitude();
  return <div>ok</div>;
}

describe('useAmplitude', () => {
  beforeEach(() => {
    delete window.engagement;
    document.getElementById('amplitude-script')?.remove();
    jest.clearAllMocks();
  });

  it('injects script with active module dev key and initializes on load', async () => {
    render(<TestComponent />);

    const script = document.getElementById('amplitude-script') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.src).toContain('/DEVKEY.engagement.js');

    // Provide engagement before triggering onload
    window.engagement = {
      boot: jest.fn(),
      shutdown: jest.fn(),
      forwardEvent: jest.fn(),
      setRouter: jest.fn(),
    };

    // Trigger load
    if (script.onload) {
      script.onload(new Event('load'));
    }

    // boot should have been called once with expected shape
    await waitFor(() => expect(window.engagement?.boot).toHaveBeenCalledTimes(1));
    const arg = (window.engagement.boot as jest.Mock).mock.calls[0][0];
    expect(arg).toHaveProperty('user.user_id', 'user-1');
    expect(arg).toHaveProperty('user.device_id', 'anon-1');
    expect(Array.isArray(arg.integrations)).toBe(true);

    // ensure Segment event forwarding handlers registered
    expect(onHandlers['track']?.length).toBeGreaterThan(0);
    expect(onHandlers['page']?.length).toBeGreaterThan(0);
  });

  it('does not inject script when feature flag is disabled', async () => {
    (useFlag as unknown as jest.Mock).mockReturnValueOnce(false);
    render(<TestComponent />);
    expect(document.getElementById('amplitude-script')).toBeFalsy();
  });

  it('logs error and does not boot when engagement is missing after script load', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<TestComponent />);
    const script = document.getElementById('amplitude-script') as HTMLScriptElement;
    expect(script).toBeTruthy();
    // Ensure engagement stays undefined and trigger load
    if (script.onload) {
      script.onload(new Event('load'));
    }
    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(window.engagement?.boot).toBeUndefined();
    errorSpy.mockRestore();
  });

  it('handles script onerror', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<TestComponent />);
    const script = document.getElementById('amplitude-script') as HTMLScriptElement;
    expect(script).toBeTruthy();
    if (script.onerror) {
      script.onerror(new Event('error'));
    }
    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    errorSpy.mockRestore();
  });

  it('handles analytics.user rejection without calling boot', async () => {
    // Provide engagement first
    window.engagement = {
      boot: jest.fn(),
      shutdown: jest.fn(),
      forwardEvent: jest.fn(),
      setRouter: jest.fn(),
    } as unknown as typeof window.engagement;
    // Make user() reject
    const originalUser = analyticsMock.user;
    analyticsMock.user = () => Promise.reject(new Error('user failed'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestComponent />);
    const script = document.getElementById('amplitude-script') as HTMLScriptElement;
    if (script.onload) {
      script.onload(new Event('load'));
    }

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(window.engagement?.boot).not.toHaveBeenCalled();

    // restore
    analyticsMock.user = originalUser;
    errorSpy.mockRestore();
  });

  it('detaches handlers on unmount', async () => {
    // Prepare engagement
    window.engagement = {
      boot: jest.fn(),
      shutdown: jest.fn(),
      forwardEvent: jest.fn(),
      setRouter: jest.fn(),
    } as unknown as typeof window.engagement;

    const { unmount } = render(<TestComponent />);
    const script = document.getElementById('amplitude-script') as HTMLScriptElement;
    if (script.onload) {
      script.onload(new Event('load'));
    }
    await waitFor(() => expect(window.engagement?.boot).toHaveBeenCalled());

    // Ensure handlers registered
    expect(onHandlers['track']?.length).toBeGreaterThan(0);
    expect(onHandlers['page']?.length).toBeGreaterThan(0);

    // Unmount and verify off called for both events with same handler ref
    unmount();
    await waitFor(() => expect(analyticsMock.off).toHaveBeenCalled());
    const calls = (analyticsMock.off as jest.Mock).mock.calls;
    const events = calls.map((c: unknown[]) => c[0]);
    expect(events).toEqual(expect.arrayContaining(['track', 'page']));
    const handlerArgs = calls.map((c: unknown[]) => c[1]);
    expect(handlerArgs[0]).toBe(handlerArgs[1]);
    expect(typeof handlerArgs[0]).toBe('function');
  });

  it('warns when amplitude key is malformed (non-string)', async () => {
    // Make module provide a non-string key so it overrides fallback and triggers guard
    (useAtomValue as unknown as jest.Mock).mockReturnValueOnce({
      analytics: { amplitude: { APIKeyDev: {} } },
    });
    const warnSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<TestComponent />);
    await waitFor(() => expect(warnSpy).toHaveBeenCalled());
    // No script should be injected
    expect(document.getElementById('amplitude-script')).toBeFalsy();
    warnSpy.mockRestore();
  });
});

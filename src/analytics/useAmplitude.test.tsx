import { render, waitFor } from '@testing-library/react';
import { useFlag } from '@unleash/proxy-client-react';
import * as amplitude from '@amplitude/analytics-browser';
import { autocapturePlugin } from '@amplitude/plugin-autocapture-browser';

const MOCK_CHROME_ANALYTICS = {
  APIKey: 'feo-prod-engagement-key',
  APIKeyDev: 'feo-dev-engagement-key',
  autocaptureAPIKey: 'feo-prod-autocapture-key',
  autocaptureAPIKeyDev: 'feo-dev-autocapture-key',
};

// Mutable mock state — tests mutate these before render
let mockModuleDefinition: Record<string, unknown> | undefined = { analytics: { amplitude: { APIKeyDev: 'module-dev-key' } } };
let mockChromeModules: Record<string, unknown> = { chrome: { analytics: MOCK_CHROME_ANALYTICS } };

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn((flag: string) => {
    if (flag === 'platform.chrome.analytics.amplitude') return true;
    if (flag === 'platform.chrome.analytics.amplitude.autocapture') return false;
    return true;
  }),
}));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../utils/common', () => ({ isProd: () => false }));
jest.mock('../state/atoms/activeModuleAtom', () => ({
  activeModuleDefinitionReadAtom: '__ACTIVE_MODULE_ATOM__',
}));
jest.mock('../state/atoms/chromeModuleAtom', () => ({
  chromeModulesAtom: '__CHROME_MODULES_ATOM__',
}));
jest.mock('jotai', () => ({
  useAtomValue: jest.fn((atom: unknown) => {
    if (atom === '__ACTIVE_MODULE_ATOM__') return mockModuleDefinition;
    if (atom === '__CHROME_MODULES_ATOM__') return mockChromeModules;
    return undefined;
  }),
}));
jest.mock('./useSegment', () => ({ useSegment: () => ({ analytics: analyticsMock, ready: true }) }));
jest.mock('@amplitude/analytics-browser', () => ({
  add: jest.fn(),
  init: jest.fn(),
}));
jest.mock('@amplitude/plugin-autocapture-browser', () => ({
  autocapturePlugin: jest.fn(() => ({ name: 'autocapture' })),
}));

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
    // Reset mutable mock state to defaults
    mockModuleDefinition = { analytics: { amplitude: { APIKeyDev: 'module-dev-key' } } };
    mockChromeModules = { chrome: { analytics: MOCK_CHROME_ANALYTICS } };
    // Clear handler registry
    Object.keys(onHandlers).forEach((key) => delete onHandlers[key]);
  });

  it('injects script with module-specific dev key when available', async () => {
    render(<TestComponent />);

    const script = document.getElementById('amplitude-script') as HTMLScriptElement;
    expect(script).toBeTruthy();
    // Module key takes priority over chrome FEO config
    expect(script.src).toContain('/module-dev-key.engagement.js');

    window.engagement = {
      boot: jest.fn(),
      shutdown: jest.fn(),
      forwardEvent: jest.fn(),
      setRouter: jest.fn(),
    };

    if (script.onload) {
      script.onload(new Event('load'));
    }

    await waitFor(() => expect(window.engagement?.boot).toHaveBeenCalledTimes(1));
    const arg = (window.engagement.boot as jest.Mock).mock.calls[0][0];
    expect(arg).toHaveProperty('user.user_id', 'user-1');
    expect(arg).toHaveProperty('user.device_id', 'anon-1');
    expect(Array.isArray(arg.integrations)).toBe(true);

    expect(onHandlers['track']?.length).toBeGreaterThan(0);
    expect(onHandlers['page']?.length).toBeGreaterThan(0);
  });

  it('falls back to chrome FEO config key when module key is absent', async () => {
    mockModuleDefinition = undefined;

    render(<TestComponent />);

    const script = document.getElementById('amplitude-script') as HTMLScriptElement;
    expect(script).toBeTruthy();
    // Should use the FEO dev key
    expect(script.src).toContain('/feo-dev-engagement-key.engagement.js');
  });

  it('does not inject script when feature flag is disabled', async () => {
    (useFlag as unknown as jest.Mock).mockImplementation(() => false);
    render(<TestComponent />);
    expect(document.getElementById('amplitude-script')).toBeFalsy();
    // Restore default mock
    (useFlag as unknown as jest.Mock).mockImplementation((flag: string) => {
      if (flag === 'platform.chrome.analytics.amplitude') return true;
      if (flag === 'platform.chrome.analytics.amplitude.autocapture') return false;
      return true;
    });
  });

  it('logs error and does not boot when engagement is missing after script load', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<TestComponent />);
    const script = document.getElementById('amplitude-script') as HTMLScriptElement;
    expect(script).toBeTruthy();
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
    window.engagement = {
      boot: jest.fn(),
      shutdown: jest.fn(),
      forwardEvent: jest.fn(),
      setRouter: jest.fn(),
    } as unknown as typeof window.engagement;
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

    analyticsMock.user = originalUser;
    errorSpy.mockRestore();
  });

  it('detaches handlers on unmount', async () => {
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

    expect(onHandlers['track']?.length).toBeGreaterThan(0);
    expect(onHandlers['page']?.length).toBeGreaterThan(0);

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
    mockModuleDefinition = { analytics: { amplitude: { APIKeyDev: {} } } };
    mockChromeModules = { chrome: { analytics: { ...MOCK_CHROME_ANALYTICS, APIKeyDev: undefined } } };

    const warnSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<TestComponent />);
    await waitFor(() => expect(warnSpy).toHaveBeenCalled());
    expect(document.getElementById('amplitude-script')).toBeFalsy();
    warnSpy.mockRestore();
  });

  it('initializes autocapture with FEO config key', async () => {
    expect(amplitude).toBeDefined();
    expect(autocapturePlugin).toBeDefined();

    (useFlag as unknown as jest.Mock).mockImplementation((flag: string) => {
      if (flag === 'platform.chrome.analytics.amplitude') return false;
      if (flag === 'platform.chrome.analytics.amplitude.autocapture') return true;
      return false;
    });

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(<TestComponent />);

    await waitFor(() => {
      expect(amplitude.add).toHaveBeenCalledWith({ name: 'autocapture' });
      expect(amplitude.init).toHaveBeenCalledWith('feo-dev-autocapture-key', 'user-1', {
        deviceId: 'anon-1',
        defaultTracking: {
          sessions: true,
          pageViews: true,
          formInteractions: true,
          fileDownloads: true,
        },
      });
    });

    expect(logSpy).toHaveBeenCalledWith('Amplitude SDK with autocapture initialized (separate project)');

    (useFlag as unknown as jest.Mock).mockImplementation((flag: string) => {
      if (flag === 'platform.chrome.analytics.amplitude') return true;
      if (flag === 'platform.chrome.analytics.amplitude.autocapture') return false;
      return true;
    });
    logSpy.mockRestore();
  });

  it('initializes both guides and autocapture when both flags are enabled', async () => {
    (useFlag as unknown as jest.Mock).mockImplementation((flag: string) => {
      if (flag === 'platform.chrome.analytics.amplitude') return true;
      if (flag === 'platform.chrome.analytics.amplitude.autocapture') return true;
      return false;
    });

    window.engagement = {
      boot: jest.fn(),
      shutdown: jest.fn(),
      forwardEvent: jest.fn(),
      setRouter: jest.fn(),
    };

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(<TestComponent />);

    const script = document.getElementById('amplitude-script') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.src).toContain('/module-dev-key.engagement.js');

    if (script.onload) {
      script.onload(new Event('load'));
    }

    await waitFor(() => {
      expect(window.engagement?.boot).toHaveBeenCalled();
      expect(amplitude.add).toHaveBeenCalledWith({ name: 'autocapture' });
      expect(amplitude.init).toHaveBeenCalled();
    });

    expect(logSpy).toHaveBeenCalledWith('Amplitude SDK with autocapture initialized (separate project)');

    (useFlag as unknown as jest.Mock).mockImplementation((flag: string) => {
      if (flag === 'platform.chrome.analytics.amplitude') return true;
      if (flag === 'platform.chrome.analytics.amplitude.autocapture') return false;
      return true;
    });
    logSpy.mockRestore();
  });

  it('logs warning when FEO analytics section is missing', async () => {
    mockModuleDefinition = undefined;
    mockChromeModules = { chrome: { manifestLocation: '/apps/chrome/js/fed-mods.json' } };

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestComponent />);

    await waitFor(() =>
      expect(warnSpy).toHaveBeenCalledWith(
        'Amplitude: analytics section not found in FEO config (fed-mods.json). Amplitude will not initialize until config is available.'
      )
    );

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('does not inject script when no keys available (FEO config missing)', async () => {
    mockModuleDefinition = undefined;
    mockChromeModules = { chrome: { manifestLocation: '/apps/chrome/js/fed-mods.json' } };

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<TestComponent />);

    // No script injected — key is undefined
    expect(document.getElementById('amplitude-script')).toBeFalsy();
    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith('Amplitude key is missing or malformed:', undefined));

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});

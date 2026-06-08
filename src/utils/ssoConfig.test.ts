import axios from 'axios';
import { DEFAULT_SSO_ROUTES, SSOConfig, getEnvDetails, resolveSSOUrl } from './common';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(),
}));

// Mock axios-cache-interceptor
jest.mock('axios-cache-interceptor', () => ({
  setupCache: jest.fn((axiosInstance) => axiosInstance),
}));

// Mock useBundle
jest.mock('../hooks/useBundle', () => ({
  getUrl: jest.fn(),
  __esModule: true,
  default: jest.fn(() => ({ bundleTitle: 'Test' })),
}));

describe('resolveSSOUrl', () => {
  afterEach(() => {
    jsdomReset();
  });

  it('should return default SSO URL when config has no ssoUrl', () => {
    const result = resolveSSOUrl({} as SSOConfig);
    expect(result).toBe('https://sso.redhat.com/auth/');
  });

  it('should return ssoUrl from config when no mapping matches', () => {
    jsdomReconfigure({ url: 'https://unknown.example.com' });
    const config: SSOConfig = {
      ssoUrl: 'https://sso.custom.com/auth',
      ssoMapping: {},
    };
    const result = resolveSSOUrl(config);
    expect(result).toBe('https://sso.custom.com/auth/');
  });

  it('should return mapped SSO URL when hostname matches a pattern', () => {
    jsdomReconfigure({ url: 'https://console.stage.redhat.com' });
    const config: SSOConfig = {
      ssoUrl: 'https://sso.redhat.com/auth',
      ssoMapping: {
        'console.stage.redhat.com': 'https://sso.stage.redhat.com/auth',
      },
    };
    const result = resolveSSOUrl(config);
    expect(result).toBe('https://sso.stage.redhat.com/auth/');
  });

  it('should match hostname patterns with partial includes', () => {
    jsdomReconfigure({ url: 'https://console.dev.redhat.com' });
    const config: SSOConfig = {
      ssoUrl: 'https://sso.redhat.com/auth',
      ssoMapping: {
        'console.dev': 'https://sso.dev.redhat.com/auth',
      },
    };
    const result = resolveSSOUrl(config);
    expect(result).toBe('https://sso.dev.redhat.com/auth/');
  });

  it('should always add trailing slash to SSO URL', () => {
    jsdomReconfigure({ url: 'https://cloud.redhat.com' });
    const config: SSOConfig = {
      ssoUrl: 'https://sso.redhat.com/auth',
      ssoMapping: {
        'cloud.redhat.com': 'https://sso.redhat.com/auth',
      },
    };
    const result = resolveSSOUrl(config);
    expect(result).toMatch(/\/$/);
  });

  it('should not double trailing slash', () => {
    const config: SSOConfig = {
      ssoUrl: 'https://sso.redhat.com/auth/',
      ssoMapping: {},
    };
    const result = resolveSSOUrl(config);
    expect(result).toBe('https://sso.redhat.com/auth/');
  });

  it('should prefer more specific pattern when multiple patterns match', () => {
    jsdomReconfigure({ url: 'https://qa.cloud.redhat.com' });
    const config: SSOConfig = {
      ssoUrl: 'https://sso.redhat.com/auth',
      ssoMapping: {
        'qa.cloud.redhat.com': 'https://sso.qa.redhat.com/auth',
        'cloud.redhat.com': 'https://sso.redhat.com/auth',
      },
    };
    const result = resolveSSOUrl(config);
    expect(result).toBe('https://sso.qa.redhat.com/auth/');
  });

  it('should prefer more specific pattern regardless of insertion order', () => {
    jsdomReconfigure({ url: 'https://qa.cloud.redhat.com' });
    const config: SSOConfig = {
      ssoUrl: 'https://sso.redhat.com/auth',
      ssoMapping: {
        'cloud.redhat.com': 'https://sso.redhat.com/auth',
        'qa.cloud.redhat.com': 'https://sso.qa.redhat.com/auth',
      },
    };
    const result = resolveSSOUrl(config);
    expect(result).toBe('https://sso.qa.redhat.com/auth/');
  });

  it('should prefer exact hostname match over partial pattern match', () => {
    jsdomReconfigure({ url: 'https://cloud.redhat.com' });
    const config: SSOConfig = {
      ssoUrl: 'https://sso.default.com/auth',
      ssoMapping: {
        'cloud.redhat.com': 'https://sso.redhat.com/auth',
        'redhat.com': 'https://sso.other.com/auth',
      },
    };
    const result = resolveSSOUrl(config);
    expect(result).toBe('https://sso.redhat.com/auth/');
  });
});

describe('loadSSOConfig', () => {
  let mockAxiosInstance: { get: jest.Mock };
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockAxiosInstance = { get: jest.fn() };
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const axiosCacheInterceptor = require('axios-cache-interceptor');
    axiosCacheInterceptor.setupCache.mockReturnValue(mockAxiosInstance);

    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    jsdomReset();
  });

  it('should successfully load operator-generated SSO config', async () => {
    const mockSSOConfig: SSOConfig = {
      ssoUrl: 'https://sso.redhat.com/auth',
      ssoMapping: {
        'cloud.redhat.com': 'https://sso.redhat.com/auth',
        'qa.cloud.redhat.com': 'https://sso.qa.redhat.com/auth',
      },
    };

    mockAxiosInstance.get.mockResolvedValue({ data: mockSSOConfig });

    const { loadSSOConfig: loadFn } = await import('./common');
    const result = await loadFn();

    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/api/chrome-service/v1/static/sso-config-generated.json',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0',
        }),
      })
    );
    expect(result).toEqual(mockSSOConfig);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should generate fallback SSO config from DEFAULT_SSO_ROUTES when request fails', async () => {
    jsdomReconfigure({ url: 'https://cloud.redhat.com' });
    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

    const { loadSSOConfig: loadFn } = await import('./common');
    const result = await loadFn();

    expect(result.ssoMapping).toBeDefined();
    expect(result.ssoUrl).toBeDefined();

    // Verify fallback mapping has all DEFAULT_SSO_ROUTES hostnames
    const expectedMapping: Record<string, string> = {};
    Object.entries(DEFAULT_SSO_ROUTES).forEach(([, config]) => {
      config.url.forEach((hostname) => {
        expectedMapping[hostname] = config.sso;
      });
    });
    expect(result.ssoMapping).toEqual(expectedMapping);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should use environment-specific ssoUrl in fallback for known hostname', async () => {
    jsdomReconfigure({ url: 'https://qa.cloud.redhat.com' });
    mockAxiosInstance.get.mockRejectedValue(new Error('Failed'));

    const { loadSSOConfig: loadFn } = await import('./common');
    const result = await loadFn();

    expect(result.ssoUrl).toBe('https://sso.qa.redhat.com/auth');
  });

  it('should use default ssoUrl in fallback for unknown hostname', async () => {
    jsdomReconfigure({ url: 'https://unknown.example.com' });
    mockAxiosInstance.get.mockRejectedValue(new Error('Failed'));

    const { loadSSOConfig: loadFn } = await import('./common');
    const result = await loadFn();

    expect(result.ssoUrl).toBe('https://sso.redhat.com/auth/');
  });
});

describe('SSO Configuration Integration', () => {
  it('should maintain consistency between DEFAULT_SSO_ROUTES and fallback mapping', () => {
    const expectedMappingSize = Object.values(DEFAULT_SSO_ROUTES).reduce((total, config) => total + config.url.length, 0);

    const ssoMapping: Record<string, string> = {};
    Object.entries(DEFAULT_SSO_ROUTES).forEach(([, config]) => {
      config.url.forEach((hostname) => {
        ssoMapping[hostname] = config.sso;
      });
    });

    expect(Object.keys(ssoMapping)).toHaveLength(expectedMappingSize);
  });

  it('should cover all major environment types in DEFAULT_SSO_ROUTES', () => {
    const envTypes = Object.keys(DEFAULT_SSO_ROUTES);

    expect(envTypes).toContain('prod');
    expect(envTypes).toContain('qa');
    expect(envTypes).toContain('ci');
    expect(envTypes).toContain('stage');
    expect(envTypes).toContain('frh');
    expect(envTypes).toContain('frhStage');

    Object.entries(DEFAULT_SSO_ROUTES).forEach(([, config]) => {
      expect(config.url).toBeDefined();
      expect(config.sso).toBeDefined();
      expect(config.portal).toBeDefined();
      expect(Array.isArray(config.url)).toBe(true);
      expect(config.url.length).toBeGreaterThan(0);
      expect(config.sso).toMatch(/^https:\/\//);
      expect(config.portal).toMatch(/^https:\/\//);
    });
  });

  it('should resolve correct SSO URL for each environment', () => {
    Object.entries(DEFAULT_SSO_ROUTES).forEach(([, config]) => {
      config.url.forEach((hostname) => {
        jsdomReconfigure({ url: `https://${hostname}` });

        const envDetails = getEnvDetails();
        expect(envDetails).toBeDefined();
        expect(envDetails?.sso).toBe(config.sso);
      });
    });
    jsdomReset();
  });
});

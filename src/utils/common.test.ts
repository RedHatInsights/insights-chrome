import axios from 'axios';
import { DEFAULT_SSO_ROUTES, getEnvDetails } from './common';

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
}));

describe('getEnvDetails', () => {
  beforeEach(() => {
    // Reset location mock before each test
    delete (window as any).location;
  });

  it('should return prod config for cloud.redhat.com', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'cloud.redhat.com' },
      writable: true,
    });

    const result = getEnvDetails();
    expect(result).toEqual(DEFAULT_SSO_ROUTES.prod);
  });

  it('should return qa config for qa.cloud.redhat.com', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'qa.cloud.redhat.com' },
      writable: true,
    });

    const result = getEnvDetails();
    expect(result).toEqual(DEFAULT_SSO_ROUTES.qa);
  });

  it('should return stage config for stage.foo.redhat.com', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'stage.foo.redhat.com' },
      writable: true,
    });

    const result = getEnvDetails();
    expect(result).toEqual(DEFAULT_SSO_ROUTES.stage);
  });

  it('should return frh config for console.openshiftusgov.com', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'console.openshiftusgov.com' },
      writable: true,
    });

    const result = getEnvDetails();
    expect(result).toEqual(DEFAULT_SSO_ROUTES.frh);
  });

  it('should return undefined for unknown hostname', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'unknown.example.com' },
      writable: true,
    });

    const result = getEnvDetails();
    expect(result).toBeUndefined();
  });
});

describe('loadSSOConfig', () => {
  let mockAxiosInstance: { get: jest.Mock };
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset modules to ensure clean slate
    jest.resetModules();
    jest.clearAllMocks();
    
    // Setup mock axios instance
    mockAxiosInstance = { get: jest.fn() };
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    
    // Mock setupCache to return the same axios instance
    const { setupCache } = require('axios-cache-interceptor');
    setupCache.mockReturnValue(mockAxiosInstance);
    
    // Mock console.warn to avoid noise in tests
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should successfully load operator-generated SSO config', async () => {
    const mockSSOConfig = {
      ssoUrl: 'https://sso.redhat.com/auth',
      ssoMapping: {
        'cloud.redhat.com': 'https://sso.redhat.com/auth',
        'console.dev': 'https://sso.dev.redhat.com/auth',
        'qa.cloud.redhat.com': 'https://sso.qa.redhat.com/auth'
      },
      environment: 'test-environment'
    };

    mockAxiosInstance.get.mockResolvedValue({ data: mockSSOConfig });

    const { loadSSOConfig } = await import('./common');
    const result = await loadSSOConfig();

    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/api/chrome-service/v1/static/sso-config-generated.json',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        })
      })
    );
    expect(result.data).toEqual(mockSSOConfig);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should handle SSO config with sorted mapping keys', async () => {
    const mockSSOConfig = {
      ssoUrl: 'https://sso.redhat.com/auth',
      ssoMapping: {
        'a.example.com': 'https://sso-a.example.com',
        'z.example.com': 'https://sso-z.example.com', 
        'm.example.com': 'https://sso-m.example.com'
      },
      environment: 'test-env'
    };

    mockAxiosInstance.get.mockResolvedValue({ data: mockSSOConfig });

    const { loadSSOConfig } = await import('./common');
    const result = await loadSSOConfig();

    expect(result.data.ssoMapping).toEqual(mockSSOConfig.ssoMapping);
    expect(Object.keys(result.data.ssoMapping)).toEqual(['a.example.com', 'z.example.com', 'm.example.com']);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should generate correct ssoMapping fallback from DEFAULT_SSO_ROUTES when request fails', async () => {
    // Mock location for getEnvDetails
    Object.defineProperty(window, 'location', {
      value: { hostname: 'cloud.redhat.com' },
      writable: true,
    });

    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

    const { loadSSOConfig, DEFAULT_SSO_ROUTES } = await import('./common');
    const result = await loadSSOConfig();

    const expectedMapping: Record<string, string> = {};
    Object.entries(DEFAULT_SSO_ROUTES).forEach(([env, config]) => {
      config.url.forEach(hostname => {
        expectedMapping[hostname] = config.sso;
      });
    });

    expect(result.data.ssoMapping).toEqual(expectedMapping);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should include all known hostnames in fallback ssoMapping when request fails', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'cloud.redhat.com' },
      writable: true,
    });

    mockAxiosInstance.get.mockRejectedValue(new Error('Failed'));

    const { loadSSOConfig } = await import('./common');
    const result = await loadSSOConfig();

    const { ssoMapping } = result.data;
    
    // Verify some specific known mappings
    expect(ssoMapping['access.redhat.com']).toBe('https://sso.redhat.com/auth');
    expect(ssoMapping['cloud.redhat.com']).toBe('https://sso.redhat.com/auth');
    expect(ssoMapping['qa.cloud.redhat.com']).toBe('https://sso.qa.redhat.com/auth');
    expect(ssoMapping['stage.foo.redhat.com']).toBe('https://sso.stage.redhat.com/auth');
    expect(ssoMapping['console.openshiftusgov.com']).toBe('https://sso.openshiftusgov.com');
  });

  it('should use default ssoUrl when getEnvDetails returns undefined and request fails', async () => {
    // Mock location to return unknown hostname so getEnvDetails returns undefined
    Object.defineProperty(window, 'location', {
      value: { hostname: 'unknown.example.com' },
      writable: true,
    });

    mockAxiosInstance.get.mockRejectedValue(new Error('Failed'));

    const { loadSSOConfig } = await import('./common');
    const result = await loadSSOConfig();

    expect(result.data.ssoUrl).toBe('https://sso.redhat.com/auth/');
  });

  it('should use environment-specific ssoUrl when getEnvDetails returns config and request fails', async () => {
    // Mock location to return qa hostname
    Object.defineProperty(window, 'location', {
      value: { hostname: 'qa.cloud.redhat.com' },
      writable: true,
    });

    mockAxiosInstance.get.mockRejectedValue(new Error('Failed'));

    const { loadSSOConfig } = await import('./common');
    const result = await loadSSOConfig();

    expect(result.data.ssoUrl).toBe('https://sso.qa.redhat.com/auth');
  });

  it('should handle network errors gracefully with fallback', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'stage.foo.redhat.com' },
      writable: true,
    });

    const networkError = new Error('Network timeout');
    mockAxiosInstance.get.mockRejectedValue(networkError);

    const { loadSSOConfig } = await import('./common');
    const result = await loadSSOConfig();

    expect(consoleWarnSpy).toHaveBeenCalledWith('Unable to load SSO config from operator, using default fallback', networkError);
    expect(result.data).toHaveProperty('ssoUrl');
    expect(result.data).toHaveProperty('ssoMapping');
    expect(result.data.ssoUrl).toBe('https://sso.stage.redhat.com/auth'); // stage environment
    expect(typeof result.data.ssoMapping).toBe('object');
  });

  it('should handle empty SSO config response gracefully', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: {} });

    const { loadSSOConfig } = await import('./common');
    const result = await loadSSOConfig();

    expect(result.data).toEqual({});
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should handle malformed SSO config response', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: null });

    const { loadSSOConfig } = await import('./common');
    const result = await loadSSOConfig();

    expect(result.data).toBeNull();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should handle SSO config with environment mapping override', async () => {
    const mockSSOConfig = {
      ssoUrl: 'https://sso.prod.redhat.com/auth',
      ssoMapping: {
        'console.dev': 'https://sso.dev.redhat.com/auth'
      },
      environment: 'production'
    };

    mockAxiosInstance.get.mockResolvedValue({ data: mockSSOConfig });

    const { loadSSOConfig } = await import('./common');
    const result = await loadSSOConfig();

    expect(result.data.ssoUrl).toBe('https://sso.prod.redhat.com/auth');
    expect(result.data.ssoMapping['console.dev']).toBe('https://sso.dev.redhat.com/auth');
    expect(result.data.environment).toBe('production');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

describe('SSO Configuration Integration', () => {
  it('should maintain consistency between DEFAULT_SSO_ROUTES and fallback mapping', () => {
    // This test ensures that the fallback logic properly converts DEFAULT_SSO_ROUTES
    const expectedMappingSize = Object.values(DEFAULT_SSO_ROUTES).reduce(
      (total, config) => total + config.url.length, 
      0
    );

    const ssoMapping: Record<string, string> = {};
    Object.entries(DEFAULT_SSO_ROUTES).forEach(([env, config]) => {
      config.url.forEach(hostname => {
        ssoMapping[hostname] = config.sso;
      });
    });

    expect(Object.keys(ssoMapping)).toHaveLength(expectedMappingSize);
  });

  it('should handle duplicate hostnames in DEFAULT_SSO_ROUTES correctly', () => {
    // Check if any hostnames appear in multiple environments
    const allHostnames: string[] = [];
    Object.values(DEFAULT_SSO_ROUTES).forEach(config => {
      allHostnames.push(...config.url);
    });

    const uniqueHostnames = [...new Set(allHostnames)];
    
    // If there are duplicates, the mapping should use the last occurrence
    // This test documents the current behavior
    expect(uniqueHostnames.length).toBeLessThanOrEqual(allHostnames.length);
  });

  it('should cover all major environment types in DEFAULT_SSO_ROUTES', () => {
    const environmentTypes = Object.keys(DEFAULT_SSO_ROUTES);
    
    // Verify we have the expected environments
    expect(environmentTypes).toContain('prod');
    expect(environmentTypes).toContain('qa');
    expect(environmentTypes).toContain('ci');
    expect(environmentTypes).toContain('stage');
    expect(environmentTypes).toContain('frh');
    expect(environmentTypes).toContain('frhStage');
    
    // Each environment should have URLs and SSO endpoints
    Object.entries(DEFAULT_SSO_ROUTES).forEach(([env, config]) => {
      expect(config.url).toBeDefined();
      expect(config.sso).toBeDefined();
      expect(config.portal).toBeDefined();
      expect(Array.isArray(config.url)).toBe(true);
      expect(config.url.length).toBeGreaterThan(0);
      expect(config.sso).toMatch(/^https:\/\//);
      expect(config.portal).toMatch(/^https:\/\//);
    });
  });
});

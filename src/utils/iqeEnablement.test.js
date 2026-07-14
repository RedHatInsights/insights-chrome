import iqeEnablement from './iqeEnablement';

describe('iqeEnablement', () => {
  test('should correctly spread headers object', async () => {
    const result = iqeEnablement.spreadAdditionalHeaders({ headers: { one: 'ONE', two: 'Two' } });

    expect(result).toEqual({ one: 'ONE', two: 'Two' });
  });

  test('should correctly spread headers from array of arrays', async () => {
    const result = iqeEnablement.spreadAdditionalHeaders({
      headers: [
        ['one', 'ONE'],
        ['two', 'Two'],
      ],
    });

    expect(result).toEqual({ one: 'ONE', two: 'Two' });
  });
});

describe('init() idempotency', () => {
  let originalFetch;
  let originalXHR;

  beforeEach(() => {
    // Reset initialization state before each test
    iqeEnablement._resetInitialization();

    // Store original implementations
    originalFetch = window.fetch;
    originalXHR = window.XMLHttpRequest;

    // Mock fetch and XHR
    window.fetch = jest.fn();
    window.XMLHttpRequest = function () {
      this.open = jest.fn();
      this.send = jest.fn();
      this.setRequestHeader = jest.fn();
    };
    window.XMLHttpRequest.prototype.open = jest.fn();
    window.XMLHttpRequest.prototype.send = jest.fn();
    window.XMLHttpRequest.prototype.setRequestHeader = jest.fn();
  });

  afterEach(() => {
    // Restore originals
    window.fetch = originalFetch;
    window.XMLHttpRequest = originalXHR;
  });

  test('should only monkey-patch once even when called multiple times', () => {
    const mockStore = { set: jest.fn() };
    const mockAuthRef = {
      current: {
        user: { access_token: 'test-token' },
        signinRedirect: jest.fn(),
        signinSilent: jest.fn(),
      },
    };

    // Store original fetch to verify it's only wrapped once
    const pristineFetch = window.fetch;

    // Call init() multiple times (simulating token renewals)
    iqeEnablement.init(mockStore, mockAuthRef);
    const firstPatch = window.fetch;

    iqeEnablement.init(mockStore, mockAuthRef);
    const secondPatch = window.fetch;

    iqeEnablement.init(mockStore, mockAuthRef);
    const thirdPatch = window.fetch;

    // All subsequent calls should result in the same patched function (no re-wrapping)
    expect(firstPatch).toBe(secondPatch);
    expect(secondPatch).toBe(thirdPatch);

    // Verify it was patched at least once
    expect(firstPatch).not.toBe(pristineFetch);
  });

  test('should not re-wrap XHR methods on multiple init() calls', () => {
    const mockStore = { set: jest.fn() };
    const mockAuthRef = {
      current: {
        user: { access_token: 'test-token' },
        signinRedirect: jest.fn(),
        signinSilent: jest.fn(),
      },
    };

    const originalSend = window.XMLHttpRequest.prototype.send;

    // First init - should patch
    iqeEnablement.init(mockStore, mockAuthRef);
    const firstPatchedSend = window.XMLHttpRequest.prototype.send;
    expect(firstPatchedSend).not.toBe(originalSend);

    // Second init - should NOT re-patch (idempotent)
    iqeEnablement.init(mockStore, mockAuthRef);
    const secondPatchedSend = window.XMLHttpRequest.prototype.send;
    expect(secondPatchedSend).toBe(firstPatchedSend);

    // Third init - still should NOT re-patch
    iqeEnablement.init(mockStore, mockAuthRef);
    const thirdPatchedSend = window.XMLHttpRequest.prototype.send;
    expect(thirdPatchedSend).toBe(firstPatchedSend);
  });
});

describe('isExcluded', () => {
  // positive cases
  test.each([
    // OpenShift upgrades_info
    'https://api.openshift.com/api/upgrades_info',
    'https://api.stage.openshift.com/api/upgrades_info',
    'https://api.prod.openshift.com/api/upgrades_info',

    // TrustArc analytics
    'https://consent.trustarc.com/analytics',
    'https://consent.trustarc.com/analytics?action=0',
    'https://consent.trustarc.com/analytics?action=0&domain=example.com',
    'http://consent.trustarc.com/analytics?test=1',
  ])('excludes %s', (url) => {
    expect(iqeEnablement.isExcluded(url)).toBe(true);
  });

  // negative cases
  test.each([
    // non‐excluded TrustArc
    'https://consent.trustarc.com/notice',
    'https://consent.trustarc.com/get',
    'https://consent.trustarc.com/asset/uspapi.js',
    'https://consent.trustarc.com/notice?c=teconsent&domain=example.com',

    // random URLs
    'https://example.com',
    'https://api.redhat.com/some/endpoint',
    'https://different-domain.com/analytics',
    'https://api.example.com/upgrades_info',
  ])('does not exclude %s', (url) => {
    expect(iqeEnablement.isExcluded(url)).toBe(false);
  });

  // edge cases
  test.each([
    ['', false],
    ['not-a-url', false],
    ['consent.trustarc.com/analytics', false],
    ['api.openshift.com/api/upgrades_info', false],
  ])('isExcluded(%s) → %s', (url, expected) => {
    expect(iqeEnablement.isExcluded(url)).toBe(expected);
  });
});

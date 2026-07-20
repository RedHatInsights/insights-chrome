import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import iqeEnablement, { _resetInitialization } from './iqeEnablement';
import type { IqeAuthRef } from './iqeEnablement';
import { createStore } from 'jotai';

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
  let originalFetch: typeof window.fetch;
  let originalXHR: typeof window.XMLHttpRequest;

  beforeEach(() => {
    // Reset initialization state before each test
    _resetInitialization();

    // Store original implementations
    originalFetch = window.fetch;
    originalXHR = window.XMLHttpRequest;

    // Mock fetch
    window.fetch = jest.fn() as typeof window.fetch;

    // Mock only XMLHttpRequest.prototype methods (not instance-level)
    // This allows init() to properly intercept and patch
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
    const mockStore = createStore();
    const mockAuthRef: React.MutableRefObject<IqeAuthRef> = {
      current: {
        user: { access_token: 'test-token' },
        signinRedirect: jest.fn<() => Promise<void>>(),
        signinSilent: jest.fn<() => Promise<unknown>>(),
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
    const mockStore = createStore();
    const mockAuthRef: React.MutableRefObject<IqeAuthRef> = {
      current: {
        user: { access_token: 'test-token' },
        signinRedirect: jest.fn<() => Promise<void>>(),
        signinSilent: jest.fn<() => Promise<unknown>>(),
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

  test('should use latest authRef token even after second init() call (token renewal scenario)', async () => {
    const mockStore = createStore();
    const mockAuthRef: React.MutableRefObject<IqeAuthRef> = {
      current: {
        user: { access_token: 'initial-token' },
        signinRedirect: jest.fn<() => Promise<void>>(),
        signinSilent: jest.fn<() => Promise<unknown>>(),
      },
    };

    // Mock fetch to return a resolved promise
    const mockFetch = jest.fn<(input: Request) => Promise<Response>>((input: Request) =>
      Promise.resolve(new Response('{}', { status: 200 }))
    );
    window.fetch = mockFetch as typeof window.fetch;

    // First init with initial token
    iqeEnablement.init(mockStore, mockAuthRef);

    // Simulate token renewal - update the authRef with new token
    mockAuthRef.current.user!.access_token = 'renewed-token';

    // Second init (should be idempotent - no re-patching)
    iqeEnablement.init(mockStore, mockAuthRef);

    // Make a fetch request to a relative API path (triggers auth injection)
    await window.fetch('/api/chrome-service/v1/test');

    // Verify fetch was called with a Request object
    expect(mockFetch).toHaveBeenCalled();
    const requestArg = mockFetch.mock.calls[0]?.[0] as Request;

    // Get the Authorization header from the request
    const authHeader = requestArg?.headers.get('Authorization');

    // Verify the renewed token is used, not the initial token
    expect(authHeader).toBe('Bearer renewed-token');
    expect(authHeader).not.toBe('Bearer initial-token');
  });

  test('should inject x-rh-frontend-origin header exactly once on fetch requests', async () => {
    const mockStore = createStore();
    const mockAuthRef: React.MutableRefObject<IqeAuthRef> = {
      current: {
        user: { access_token: 'test-token' },
        signinRedirect: jest.fn<() => Promise<void>>(),
        signinSilent: jest.fn<() => Promise<unknown>>(),
      },
    };

    // Mock the original fetch to capture the final Request object
    let capturedRequest: Request | undefined;
    const mockOriginalFetch = jest.fn((req: Request) => {
      capturedRequest = req;
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

    // Set up the mock BEFORE init
    window.fetch = mockOriginalFetch as typeof window.fetch;

    // Now init will wrap our mock
    iqeEnablement.init(mockStore, mockAuthRef);

    // Make a fetch request to location.origin + /api path (triggers both headers)
    await window.fetch(`${location.origin}/api/test-endpoint`);

    // Verify headers
    expect(mockOriginalFetch).toHaveBeenCalled();
    expect(capturedRequest).toBeDefined();

    const authHeader = capturedRequest!.headers.get('Authorization');
    const originHeader = capturedRequest!.headers.get('x-rh-frontend-origin');

    expect(authHeader).toBe('Bearer test-token');
    expect(originHeader).toBe('hcc');

    // Verify headers appear only once (no duplicates)
    const allHeaders = Array.from(capturedRequest!.headers.entries());
    const authCount = allHeaders.filter(([key]) => key.toLowerCase() === 'authorization').length;
    const originCount = allHeaders.filter(([key]) => key === 'x-rh-frontend-origin').length;

    expect(authCount).toBe(1);
    expect(originCount).toBe(1);
  });

  test('should inject headers exactly once on XMLHttpRequest after multiple init() calls', () => {
    const mockStore = createStore();
    const mockAuthRef: React.MutableRefObject<IqeAuthRef> = {
      current: {
        user: { access_token: 'test-token' },
        signinRedirect: jest.fn<() => Promise<void>>(),
        signinSilent: jest.fn<() => Promise<unknown>>(),
      },
    };

    // Restore real XHR
    window.XMLHttpRequest = originalXHR;

    // Track setRequestHeader calls
    const setRequestHeaderSpy = jest.fn();
    const originalSetRequestHeader = window.XMLHttpRequest.prototype.setRequestHeader;

    window.XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string) {
      setRequestHeaderSpy(name, value);
      return originalSetRequestHeader.call(this, name, value);
    };

    // Call init() multiple times - should only patch once
    iqeEnablement.init(mockStore, mockAuthRef);
    iqeEnablement.init(mockStore, mockAuthRef);
    iqeEnablement.init(mockStore, mockAuthRef);

    // Instantiate an XMLHttpRequest and call methods
    const xhr = new window.XMLHttpRequest();
    xhr.open('GET', `${location.origin}/api/test-endpoint`);
    xhr.send();

    // Verify setRequestHeader was called exactly twice (Authorization + x-rh-frontend-origin)
    // Even though init() was called 3 times, headers should only be injected once
    // Note: 'Auth' is converted to 'Authorization' by the setRequestHeader wrapper
    expect(setRequestHeaderSpy).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(setRequestHeaderSpy).toHaveBeenCalledWith('x-rh-frontend-origin', 'hcc');

    // Count calls - should be exactly 2 total
    expect(setRequestHeaderSpy).toHaveBeenCalledTimes(2);

    const authCalls = setRequestHeaderSpy.mock.calls.filter(([name]) => name === 'Authorization');
    const originCalls = setRequestHeaderSpy.mock.calls.filter(([name]) => name === 'x-rh-frontend-origin');

    expect(authCalls.length).toBe(1);
    expect(originCalls.length).toBe(1);
  });
});

describe('header injection helpers', () => {
  describe('spreadAdditionalHeaders with Headers object', () => {
    test('should pass through Headers instance unchanged', () => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Accept', 'application/json');

      const result = iqeEnablement.spreadAdditionalHeaders({ headers });

      // Current implementation returns Headers object as-is (not converted to plain object)
      expect(result).toBe(headers);
      expect(result instanceof Headers).toBe(true);
    });

    test('should return empty object when no headers provided', () => {
      const result = iqeEnablement.spreadAdditionalHeaders(undefined);
      expect(result).toEqual({});
    });

    test('should return empty object when headers is undefined in options', () => {
      const result = iqeEnablement.spreadAdditionalHeaders({});
      expect(result).toEqual({});
    });
  });
});

describe('hasPendingAjax', () => {
  test('should return false when no pending requests', () => {
    const result = iqeEnablement.hasPendingAjax();
    expect(result).toBe(false);
  });
});

describe('isPageSafe', () => {
  test('should return true when no unsafe elements', () => {
    const result = iqeEnablement.isPageSafe();
    expect(result).toBe(true);
  });

  test('should return false when unsafe elements present', () => {
    // Add an unsafe element
    const div = document.createElement('div');
    div.setAttribute('data-ouia-safe', 'false');
    document.body.appendChild(div);

    const result = iqeEnablement.isPageSafe();
    expect(result).toBe(false);

    // Cleanup
    document.body.removeChild(div);
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
  test.each<[string, boolean]>([
    ['', false],
    ['not-a-url', false],
    ['consent.trustarc.com/analytics', false],
    ['api.openshift.com/api/upgrades_info', false],
  ])('isExcluded(%s) → %s', (url, expected) => {
    expect(iqeEnablement.isExcluded(url)).toBe(expected);
  });
});

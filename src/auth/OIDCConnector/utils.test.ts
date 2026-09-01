import { AuthContextProps } from 'react-oidc-context';
import { login, sanitizeRedirectUri } from './utils';
import { OIDC_RESERVED_PARAMS } from '../../utils/consts';

describe('sanitizeRedirectUri', () => {
  afterEach(() => {
    jsdomReset();
  });

  it('strips every OIDC-reserved param from the query string', () => {
    const query = OIDC_RESERVED_PARAMS.map((p) => `${p}=x`).join('&');
    const result = sanitizeRedirectUri(`https://console.redhat.com/insights?${query}`);
    expect(result).toBe('https://console.redhat.com/insights');
  });

  it('strips every OIDC-reserved param from the fragment', () => {
    const fragment = OIDC_RESERVED_PARAMS.map((p) => `${p}=x`).join('&');
    const result = sanitizeRedirectUri(`https://console.redhat.com/insights#${fragment}`);
    expect(result).toBe('https://console.redhat.com/insights');
  });

  it('strips reserved params from a mixed query + fragment while keeping legit content', () => {
    const result = sanitizeRedirectUri('https://console.redhat.com/insights?from-aws=1&state=abc&code=xyz#workloads=a&session_state=1&tags=b');
    expect(result).toBe('https://console.redhat.com/insights?from-aws=1#workloads=a&tags=b');
  });

  it('preserves legitimate query params (noauth, from-aws)', () => {
    const url = 'https://console.redhat.com/insights?from-aws=1&noauth=tok';
    expect(sanitizeRedirectUri(url)).toBe(url);
  });

  it('preserves a legitimate global-filter fragment', () => {
    const url = 'https://console.redhat.com/insights#workloads=a&tags=b';
    expect(sanitizeRedirectUri(url)).toBe(url);
  });

  it('preserves a plain #anchor fragment', () => {
    const url = 'https://console.redhat.com/insights#dashboard';
    expect(sanitizeRedirectUri(url)).toBe(url);
  });

  it('does not leave a dangling # when the fragment becomes empty', () => {
    const result = sanitizeRedirectUri('https://console.redhat.com/insights#code=abc&state=def');
    expect(result).toBe('https://console.redhat.com/insights');
    expect(result).not.toContain('#');
  });

  it('is a no-op for an already-clean URL', () => {
    const url = 'https://console.redhat.com/insights/dashboard?from-azure=1';
    expect(sanitizeRedirectUri(url)).toBe(url);
  });

  it('is idempotent', () => {
    const dirty = 'https://console.redhat.com/insights?state=abc&from-gcp=1#code=xyz&workloads=a';
    const once = sanitizeRedirectUri(dirty);
    expect(sanitizeRedirectUri(once)).toBe(once);
  });

  it('defaults to location.href when no argument is passed', () => {
    jsdomReconfigure({ url: 'https://console.redhat.com/insights?state=abc&from-aws=1' });
    expect(sanitizeRedirectUri()).toBe('https://console.redhat.com/insights?from-aws=1');
  });
});

describe('login', () => {
  const buildAuth = () =>
    ({
      signinRedirect: jest.fn(() => Promise.resolve()),
    }) as unknown as AuthContextProps;

  afterEach(() => {
    jsdomReset();
    jest.clearAllMocks();
  });

  it('sanitizes the redirect_uri before sending it to SSO', () => {
    const auth = buildAuth();
    login(auth, [], 'https://console.redhat.com/insights?state=abc&code=xyz&from-aws=1');
    expect(auth.signinRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        redirect_uri: 'https://console.redhat.com/insights?from-aws=1',
      })
    );
  });

  it('leaves a clean redirect_uri unchanged and still passes scope + nonce', () => {
    const auth = buildAuth();
    login(auth, [], 'https://console.redhat.com/insights');
    const arg = (auth.signinRedirect as jest.Mock).mock.calls[0][0] as { redirect_uri: string; scope: string; nonce: string };
    expect(arg.redirect_uri).toBe('https://console.redhat.com/insights');
    expect(arg.scope).toContain('openid');
    expect(arg.nonce).toEqual(expect.any(String));
  });
});

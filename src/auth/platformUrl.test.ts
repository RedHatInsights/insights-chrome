/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DEFAULT_SSO_ROUTES } from '../utils/common';
import platformUrl from './platformUrl';

describe('platformUrl', () => {
  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = {};
  });
  it('should pick default platform qa sso url if no extra config was setup', () => {
    const ssourl = platformUrl(DEFAULT_SSO_ROUTES);
    expect(ssourl).toBe('https://sso.qa.redhat.com/auth');
  });

  it('should return dev sso url if env is set to console.dev', () => {
    window.location.hostname = 'console.dev.redhat.com';
    const ssourl = platformUrl(DEFAULT_SSO_ROUTES);
    expect(ssourl).toBe(DEFAULT_SSO_ROUTES.dev.sso + '/');
    // don't forget to reset the hostname for other tests
    window.location.hostname = '';
  });

  it('should return custom sso url if provided', () => {
    const customSsoUrl = 'https://custom.sso.url';
    const ssourl = platformUrl(DEFAULT_SSO_ROUTES, customSsoUrl);
    expect(ssourl).toBe(customSsoUrl + '/');
  });

  // test for all envs using the DEFAULT_SSO_ROUTES
  Object.entries(DEFAULT_SSO_ROUTES).forEach(([env, { url }]) => {
    url.forEach((url) => {
      it(`should return ${env} sso url if env is set to ${url}`, () => {
        window.location.hostname = url;
        const ssourl = platformUrl(DEFAULT_SSO_ROUTES);
        expect(ssourl).toMatch(new RegExp(DEFAULT_SSO_ROUTES[env as keyof typeof DEFAULT_SSO_ROUTES].sso));
        // Must always end with trailing slash
        expect(ssourl).toMatch(/\/$/);
        // don't forget to reset the hostname for other tests
        window.location.hostname = '';
      });
    });
  });
});

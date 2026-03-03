import Cookies from 'js-cookie';
import { ACCOUNT_REQUEST_TIMEOUT, ACTIVE_REMOTE_REQUEST, CROSS_ACCESS_ACCOUNT_NUMBER, CROSS_ACCESS_ORG_ID } from '../utils/consts';
import crossAccountBouncer from './crossAccountBouncer';

/**
 * Note: crossAccountBouncer() unconditionally calls window.location.reload().
 * In jsdom 26, location.reload is non-configurable and cannot be spied on.
 * The reload behavior should be verified via Cypress/Playwright e2e tests.
 */
describe('crossAccountBouncer', () => {
  const mockCookiesGet = jest.spyOn(Cookies, 'get');
  const mockCookiesRemove = jest.spyOn(Cookies, 'remove');

  beforeEach(() => {
    mockCookiesGet.mockClear();
    mockCookiesRemove.mockClear();
    localStorage.removeItem(ACTIVE_REMOTE_REQUEST);
    localStorage.removeItem(ACCOUNT_REQUEST_TIMEOUT);
  });

  it('sets localStorage request timeout and removes active remote request', () => {
    // @ts-expect-error mock returns string instead of Record<string, string>
    mockCookiesGet.mockReturnValueOnce('some-cookie');
    crossAccountBouncer();
    expect(localStorage.getItem(ACCOUNT_REQUEST_TIMEOUT)).toEqual('some-cookie');
    expect(localStorage.getItem(ACTIVE_REMOTE_REQUEST)).toBeNull();
  });

  it('does not set localStorage and calls Cookies.remove', () => {
    // @ts-expect-error mock returns undefined instead of Record<string, string>
    mockCookiesGet.mockReturnValueOnce(undefined);
    crossAccountBouncer();
    expect(localStorage.getItem(ACCOUNT_REQUEST_TIMEOUT)).toBeNull();
    expect(mockCookiesRemove).toHaveBeenCalledWith(CROSS_ACCESS_ACCOUNT_NUMBER);
    expect(mockCookiesRemove).toHaveBeenCalledWith(CROSS_ACCESS_ORG_ID);
  });
});

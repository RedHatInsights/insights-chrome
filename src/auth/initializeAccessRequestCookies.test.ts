/* eslint-disable @typescript-eslint/ban-ts-comment */
import initializeAccessRequestCookies from './initializeAccessRequestCookies';
import * as crossAccountBouncer from './crossAccountBouncer';
import Cookies from 'js-cookie';
import { ACTIVE_REMOTE_REQUEST, CROSS_ACCESS_ACCOUNT_NUMBER } from '../utils/consts';

jest.mock('./crossAccountBouncer', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

describe('initializeAccessRequestCookies', () => {
  const mockCrossAccountBouncer = jest.spyOn(crossAccountBouncer, 'default');
  const mockCookiesGet = jest.spyOn(Cookies, 'get');
  const mockCookiesRemove = jest.spyOn(Cookies, 'remove');
  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = {};
  });
  beforeEach(() => {
    mockCrossAccountBouncer.mockClear();
    localStorage.removeItem(ACTIVE_REMOTE_REQUEST);
    // @ts-ignore
    window.location = {};
  });

  it('does nothing if no initial account is set in localStorage and no Cookie is set', () => {
    initializeAccessRequestCookies();
    expect(mockCrossAccountBouncer).not.toHaveBeenCalled();
  });

  it('does nothing if Cookie is set but no initial account is set in localStorage', () => {
    // @ts-ignore
    mockCookiesGet.mockReturnValueOnce('some-cookie');
    initializeAccessRequestCookies();
    expect(mockCrossAccountBouncer).not.toHaveBeenCalled();
  });

  // does nothing if localStorage is set but no Cookie is set
  it('does nothing if localStorage is set but no Cookie is set', () => {
    // @ts-ignore
    mockCookiesGet.mockReturnValueOnce(undefined);
    localStorage.setItem(ACTIVE_REMOTE_REQUEST, 'some-local-storage');
    initializeAccessRequestCookies();
    expect(mockCrossAccountBouncer).not.toHaveBeenCalled();
  });

  it('calls Cookies.remove if the initial account fails to parse', () => {
    // @ts-ignore
    mockCookiesGet.mockReturnValueOnce('some-cookie');
    localStorage.setItem(ACTIVE_REMOTE_REQUEST, 'some-local-storage');
    initializeAccessRequestCookies();
    expect(mockCookiesRemove).toHaveBeenCalledWith(CROSS_ACCESS_ACCOUNT_NUMBER);
  });

  it('calls crossAccountBouncer if the initial account is expired', () => {
    // @ts-ignore
    mockCookiesGet.mockReturnValueOnce('some-cookie');
    localStorage.setItem(
      ACTIVE_REMOTE_REQUEST,
      JSON.stringify({
        // past date
        end_date: '2020-01-01',
      })
    );
    initializeAccessRequestCookies();
    expect(mockCrossAccountBouncer).toHaveBeenCalled();
  });

  // does nothing if the initial account is not expired
  it('does nothing if the initial account is not expired', () => {
    // @ts-ignore
    mockCookiesGet.mockReturnValueOnce('some-cookie');
    localStorage.setItem(
      ACTIVE_REMOTE_REQUEST,
      JSON.stringify({
        // future date
        end_date: new Date(new Date().getTime() + 1000 * 60 * 60 * 24).toISOString(),
      })
    );
    initializeAccessRequestCookies();
    expect(mockCrossAccountBouncer).not.toHaveBeenCalled();
  });
});

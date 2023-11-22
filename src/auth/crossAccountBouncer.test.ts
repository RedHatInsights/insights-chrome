/* eslint-disable @typescript-eslint/ban-ts-comment */
import Cookies from 'js-cookie';
import { ACCOUNT_REQUEST_TIMEOUT, ACTIVE_REMOTE_REQUEST, CROSS_ACCESS_ACCOUNT_NUMBER, CROSS_ACCESS_ORG_ID } from '../utils/consts';
import crossAccountBouncer from './crossAccountBouncer';

describe('crossAccountBouncer', () => {
  const mockCookiesGet = jest.spyOn(Cookies, 'get');
  const mockCookiesRemove = jest.spyOn(Cookies, 'remove');
  const reloadMock = jest.fn();
  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = {
      reload: reloadMock,
    };
  });

  beforeEach(() => {
    mockCookiesGet.mockClear();
    mockCookiesRemove.mockClear();
    localStorage.removeItem(ACTIVE_REMOTE_REQUEST);
    localStorage.removeItem(ACCOUNT_REQUEST_TIMEOUT);
    reloadMock.mockClear();
  });

  it('sets localStorage request timeout and removes active remote request', () => {
    // @ts-ignore
    mockCookiesGet.mockReturnValueOnce('some-cookie');
    crossAccountBouncer();
    expect(localStorage.getItem(ACCOUNT_REQUEST_TIMEOUT)).toEqual('some-cookie');
    expect(localStorage.getItem(ACTIVE_REMOTE_REQUEST)).toBeNull();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('does not set localStorage and calls Cookies.remove', () => {
    // @ts-ignore
    mockCookiesGet.mockReturnValueOnce(undefined);
    crossAccountBouncer();
    expect(localStorage.getItem(ACCOUNT_REQUEST_TIMEOUT)).toBeNull();
    expect(mockCookiesRemove).toHaveBeenCalledWith(CROSS_ACCESS_ACCOUNT_NUMBER);
    expect(mockCookiesRemove).toHaveBeenCalledWith(CROSS_ACCESS_ORG_ID);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});

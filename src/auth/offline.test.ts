import { getOfflineToken, getPostDataObject, parseHashString, postbackUrlSetup, prepareOfflineRedirect } from './offline';
import { OFFLINE_REDIRECT_STORAGE_KEY, offlineToken } from '../utils/consts';

jest.mock('axios', () => {
  const axios = jest.requireActual('axios');
  return {
    __esModule: true,
    ...axios,
    default: {
      ...axios.default,
      post: () =>
        Promise.resolve({
          data: {
            foo: 'bar',
          },
        }),
    },
  };
});

describe('offline', () => {
  let pushStateSpy: jest.SpyInstance;
  beforeEach(() => {
    localStorage.removeItem(OFFLINE_REDIRECT_STORAGE_KEY);
    jsdomReconfigure({ url: 'http://console.redhat.com' });
    pushStateSpy = jest.spyOn(window.history, 'pushState').mockImplementation(() => undefined);
  });
  afterEach(() => {
    pushStateSpy.mockRestore();
    jsdomReset();
  });

  it('creates valid postback data object', () => {
    const postData = getPostDataObject('http://localhost:3000', 'clientId', 'code');
    expect(postData).toEqual({
      code: 'code',
      grant_type: 'authorization_code',
      client_id: 'clientId',
      redirect_uri: 'http://localhost:3000',
    });
  });

  it('parses hash string', () => {
    const hashString = '#code=code&state=state';
    const parsed = parseHashString(hashString);
    expect(parsed).toEqual({
      code: 'code',
      state: 'state',
    });
  });

  it('can parse hash string with no state', () => {
    const hashString = '#code=code';
    const parsed = parseHashString(hashString);
    expect(parsed).toEqual({
      code: 'code',
    });
  });

  it('can prase empty hash string', () => {
    const hashString = '#';
    const parsed = parseHashString(hashString);
    expect(parsed).toEqual({});
  });

  it('can parse empty string', () => {
    const hashString = '';
    const parsed = parseHashString(hashString);
    expect(parsed).toEqual({});
  });

  it('prepares offline redirect URL from current location.href', () => {
    const offlineRedirectUrl = prepareOfflineRedirect();
    const redirectUri = `${window.location.origin}?noauth=${offlineToken}`;
    expect(offlineRedirectUrl).toEqual(redirectUri);
    expect(localStorage.getItem(OFFLINE_REDIRECT_STORAGE_KEY)).toEqual(redirectUri);
  });

  it('prepares offline redirect URL from custom url base', () => {
    const base = 'https://example.com';
    const offlineRedirectUrl = prepareOfflineRedirect(base);
    const redirectUri = `${base}?noauth=${offlineToken}`;
    expect(offlineRedirectUrl).toEqual(redirectUri);
    expect(localStorage.getItem(OFFLINE_REDIRECT_STORAGE_KEY)).toEqual(redirectUri);
  });

  it('postbackUrlSetup does nothing if URL does not contain offline token', () => {
    postbackUrlSetup();
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('postbackUrlSetup should remove delete the offline query param from url', () => {
    jsdomReconfigure({ url: `http://console.redhat.com?noauth=${offlineToken}` });
    postbackUrlSetup();
    expect(pushStateSpy).toHaveBeenCalledWith('offlinePostback', '', 'http://console.redhat.com/');
  });

  it('getOfflineToken should retrieve offline token', async () => {
    const token = await getOfflineToken('http://localhost:3000/auth/token', 'clientId', 'http://localhost:3000');
    expect(token).toEqual({
      data: {
        foo: 'bar',
      },
    });
  });
});

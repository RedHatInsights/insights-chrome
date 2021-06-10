const mockAxios = require('jest-mock-axios').default;
const offline = require('./offline');

const defaults = {
  location: {
    hash: '#foo=bar',
    search: '?noauth=2402500adeacc30eb5c5a8a5e2e0ec1f',
    href: 'https://test.com/some/path?noauth=2402500adeacc30eb5c5a8a5e2e0ec1f#foo=bar',
    origin: 'https://test.com',
    pathname: '/some/path',
  },
};

function getMockWindow(location) {
  const loc = location || defaults.location;
  return {
    location: loc,
    history: {
      pushState: (one, two, url) => {
        loc.__foo__ = url;
      },
    },
  };
}

describe('Offline', () => {
  test('window works', () => {
    // this is really just to reach 100% for this module
    // getWindow was just introduced to allow for code to work
    // and test code too
    expect(offline.__get__('getWindow')()).toBe(window);
  });
  describe('getOfflineToken', () => {
    test('fails when there is no offline postbackUrl', async () => {
      try {
        await offline.getOfflineToken();
      } catch (e) {
        expect(e).toBe('not available');
      }
    });

    test('POSTs to /token with the right parameters when input is good', () => {
      offline.__set__('priv', { postbackUrl: 'https://test.com/?noauth=foo#test=bar&code=test123' });
      offline.getOfflineToken('', 'test321');
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'code=test123&grant_type=authorization_code&client_id=test321' + '&redirect_uri=https%3A%2F%2Ftest.com%2F%3Fnoauth%3Dfoo',
        })
      );
    });
  });

  describe('wipePostbackParamsThatAreNotForUs', () => {
    describe('when no auth param is present', () => {
      const getPostbackUrl = offline.__get__('getPostbackUrl');
      let testWindow = {};

      beforeEach(() => {
        testWindow = getMockWindow();
        // dirty hack to make the module loader work in test
        // without this I can `rm node_modules/urijs/src/*js`
        // and still the require in test mode loads some urijs from insights-components
        // and that lib is causing issues
        //
        // this hack is only necessry in test mode
        offline.__set__('urijs', require('../../../../node_modules/urijs/src/URI'));
        offline.__set__('getWindow', () => {
          return testWindow;
        });
        offline.wipePostbackParamsThatAreNotForUs();
      });

      test('strips hash', () => {
        expect(testWindow.location.hash).toBe('');
      });

      test('sets postbackUrl', () => {
        expect(getPostbackUrl()).toBe('https://test.com/some/path?noauth=2402500adeacc30eb5c5a8a5e2e0ec1f');
      });

      test('removes noauth query param', () => {
        expect(testWindow.location.__foo__).not.toMatch('noauth=2402500adeacc30eb5c5a8a5e2e0ec1');
      });

      test('removes noauth query param with others', () => {
        const w = getMockWindow({ href: 'https://example.com?noauth=2402500adeacc30eb5c5a8a5e2e0ec1f&test=bar&bar=baz' });
        offline.__set__('getWindow', () => {
          return w;
        });
        offline.wipePostbackParamsThatAreNotForUs();
        expect(w.location.__foo__).toMatch('https://example.com/?test=bar&bar=baz');
      });
    });
  });

  describe('parseHashString', () => {
    const parseHashString = offline.__get__('parseHashString');
    test('can parse KC form data in hash', () => {
      const url = 'https://cloud.redhat.com/?foo=bar#bar=baz&foo=bar';
      expect(parseHashString(url)).toMatchObject({
        bar: 'baz',
        foo: 'bar',
      });
    });
  });

  describe('getPostDataString', () => {
    const getPostDataString = offline.__get__('getPostDataString');
    test('returns valid string', () => {
      const o = { foo: 'bar', test: '123' };
      expect(getPostDataString(o)).toBe('foo=bar&test=123');
    });
  });

  describe('getPostDataObject', () => {
    const getPostDataObject = offline.__get__('getPostDataObject');
    test('returns valid parameters', () => {
      const o = getPostDataObject('https://example.com', 'cloud-services', 'deadbeef');
      expect(o).toHaveProperty('code', 'deadbeef');
      expect(o).toHaveProperty('grant_type', 'authorization_code');
      expect(o).toHaveProperty('redirect_uri', 'https%3A%2F%2Fexample.com');
      expect(o).toHaveProperty('client_id', 'cloud-services');
    });
  });

  describe('getPostbackUrl', () => {
    const getPostbackUrl = offline.__get__('getPostbackUrl');
    test('can get the URL once', () => {
      offline.__set__('priv', { postbackUrl: 'foo' });
      expect(getPostbackUrl()).toBe('foo');
    });
    test('cannot get URL twice', () => {
      offline.__set__('priv', { postbackUrl: 'foo' });
      expect(getPostbackUrl()).toBe('foo');
      expect(getPostbackUrl()).toBe(undefined);
    });
  });
});

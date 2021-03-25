jest.mock('./entitlements');

const mockedEntitlements = require('./entitlements');
const token = require('../../../../testdata/token.json');
const userOutput = require('../../../../testdata/user.json');
const user = require('./user');
const replaceMock = jest.fn();

describe('User', () => {
  const { location } = window;

  beforeAll(() => {
    delete window.location;
    window.location = {
      pathname: '/insights/foo',
      replace: replaceMock,
    };
  });

  afterAll(() => {
    window.location = location;
  });
  const buildUser = user.__get__('buildUser');

  describe('buildUser', () => {
    test('transforms a token into a User object', () => {
      expect(buildUser(token)).toMatchObject(userOutput);
    });
  });

  /* eslint-disable camelcase */
  describe('tryBounceIfUnentitled', () => {
    const tryBounceIfUnentitled = user.__get__('tryBounceIfUnentitled');
    const ents = {
      insights: { is_entitled: false },
      openshift: { is_entitled: false },
      cost_management: { is_entitled: false },
    };

    beforeEach(() => {
      replaceMock.mockReset();
    });

    test('should *not* bounce if the section is unkown', () => {
      ents.insights.is_entitled = false;
      tryBounceIfUnentitled(ents, 'apps');
      tryBounceIfUnentitled(ents, 'foo');
      tryBounceIfUnentitled(ents, 'test');
      expect(replaceMock).not.toBeCalled();
    });

    test('should bounce if unentitled', () => {
      tryBounceIfUnentitled(ents, 'insights');
      expect(replaceMock).lastCalledWith('http://localhost/?not_entitled=insights');

      tryBounceIfUnentitled(ents, 'cost-management');
      expect(replaceMock).lastCalledWith('http://localhost/?not_entitled=cost_management');
    });

    test('should *not* bounce if entitled', () => {
      ents.insights.is_entitled = true;
      tryBounceIfUnentitled(ents, 'insights');
      expect(replaceMock).not.toBeCalled();
    });
  });
  /* eslint-enable camelcase */

  describe('default', () => {
    test('appends the entitlements data onto the user object', async () => {
      const o = await user.default(token);
      expect(o).toHaveProperty('entitlements', { foo: 'bar' });
      expect(o).toHaveProperty('identity');
    });
    test('uses the token.jti field as a cache key', () => {
      expect(mockedEntitlements.default).toBeCalledWith(token.jti);
      user.default(token);
    });
  });
});

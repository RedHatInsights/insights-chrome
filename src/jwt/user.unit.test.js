jest.mock('./entitlements');

const mockedEntitlements = require('./entitlements');
const token = require('../../testdata/token.json');
const userOutput = require('../../testdata/user.json');
const user = require('./user');
const { setAnsibleTrialFlag, ANSIBLE_TRIAL_FLAG } = require('../utils/isAnsibleTrialFlagActive');
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

  describe('buildUser', () => {
    test('transforms a token into a User object', () => {
      expect(user.buildUser(token)).toEqual(userOutput);
    });
  });

  /* eslint-disable camelcase */
  describe('tryBounceIfUnentitled', () => {
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
      user.tryBounceIfUnentitled(ents, 'apps');
      user.tryBounceIfUnentitled(ents, 'foo');
      user.tryBounceIfUnentitled(ents, 'test');
      expect(replaceMock).not.toBeCalled();
    });

    test('should bounce if unentitled', () => {
      user.tryBounceIfUnentitled(ents, 'insights');
      expect(replaceMock).lastCalledWith('https://test.com/?not_entitled=insights');

      user.tryBounceIfUnentitled(ents, 'cost-management');
      expect(replaceMock).lastCalledWith('https://test.com/?not_entitled=cost_management');

      user.tryBounceIfUnentitled(ents, 'ansible');
      expect(replaceMock).lastCalledWith('https://test.com/ansible/ansible-dashboard/trial');
    });

    test('should properly bounce if unentitled user with ansible trial locastorage flags', () => {
      jest.useFakeTimers();
      // enable ansible trial flag
      setAnsibleTrialFlag(Date.now());
      // advance time by one minute. user should not be bounced
      jest.advanceTimersByTime(1 * 60 * 1000);
      user.tryBounceIfUnentitled(ents, 'ansible');
      expect(replaceMock).not.toBeCalled();

      // advace time by additional 10 minutes. user should be bounced to /trial/expired
      jest.advanceTimersByTime(10 * 60 * 1000);
      user.tryBounceIfUnentitled(ents, 'ansible');
      expect(replaceMock).toBeCalledTimes(1);
      expect(replaceMock).toHaveBeenLastCalledWith('https://test.com/ansible/ansible-dashboard/trial/expired');
      replaceMock.mockClear();

      // should not be bounced at all if entitled to ansible
      user.tryBounceIfUnentitled(
        {
          ansible: {
            is_entitled: true,
          },
        },
        'ansible'
      );
      expect(replaceMock).not.toBeCalled();

      // clear the ansible trial flag
      localStorage.removeItem(ANSIBLE_TRIAL_FLAG);
    });

    test('should *not* bounce if entitled', () => {
      ents.insights.is_entitled = true;
      user.tryBounceIfUnentitled(ents, 'insights');
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

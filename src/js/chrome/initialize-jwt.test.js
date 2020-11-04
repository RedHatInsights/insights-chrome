import initializeJWT from './initialize-jwt';

jest.mock('../jwt/jwt');

describe('initializeJWT', () => {
  const initPromise = Promise.resolve();
  const libJWT = {
    initPromise,
    jwt: {
      getUserInfo: () => Promise.resolve({ foo: 'bar' }),
      getEncodedToken: () => 'foo',
    },
  };

  it('should assing cache attribute to chrome instance regardless of init result', async () => {
    expect.assertions(2);
    const instance = {};
    expect(Object.prototype.hasOwnProperty.call(instance, 'cache')).toEqual(false);
    await initializeJWT(libJWT, instance);
    expect(Object.prototype.hasOwnProperty.call(instance, 'cache')).toEqual(true);
  });
});

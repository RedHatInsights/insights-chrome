import createChromeInstance from './create-chrome';

jest.mock('../jwt/jwt');
jest.mock('../nav/sourceOfTruth');
jest.mock('../nav/globalNav');
jest.mock('../rbac/fetchPermissions');

describe('create chrome', () => {
  const insights = {};
  let jwt;
  beforeEach(() => {
    jwt = {
      initPromise: new Promise((res) => setTimeout(() => res(), 200)),
      jwt: {
        getUserInfo: () => Promise.resolve({ foo: 'bar' }),
        getEncodedToken: (x) => x,
      },
    };
  });

  it('should create chrome instance', () => {
    const { chrome } = createChromeInstance(jwt, insights);
    expect(chrome).toEqual(expect.any(Object));
  });

  it('should postpone getUserPermissions resolve, after chrome cache is initialized', () => {
    const promiseSpy = jest.fn();
    expect.assertions(1);
    const {
      chrome: { getUserPermissions },
    } = createChromeInstance(jwt, insights);
    return getUserPermissions(promiseSpy).then(() => {
      expect(promiseSpy).toHaveBeenCalledWith('mocked-user-permissions');
    });
  });
});

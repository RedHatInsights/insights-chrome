import { initializeVisibilityFunctions } from '../utils/VisibilitySingleton';
import { createChromeContext } from './create-chrome';

jest.mock('@scalprum/core', () => {
  return {
    __esModule: true,
    initSharedScope: jest.fn(),
    getSharedScope: jest.fn().mockReturnValue({}),
  };
});

jest.mock('../jwt/jwt');
jest.mock('../auth/fetchPermissions');

describe('create chrome', () => {
  let jwt;
  beforeAll(() => {
    initializeVisibilityFunctions({});
  });
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
    const chrome = createChromeContext({
      libJwt: jwt,
      store: {},
      getUser: () => Promise.resolve(),
    });
    expect(chrome).toEqual(expect.any(Object));
  });

  it('should postpone getUserPermissions resolve, after chrome cache is initialized', () => {
    const promiseSpy = jest.fn();
    expect.assertions(1);
    const { getUserPermissions } = createChromeContext({
      libJwt: jwt,
      store: {},
      getUser: () => Promise.resolve(),
    });
    return getUserPermissions(promiseSpy).then(() => {
      expect(promiseSpy).toHaveBeenCalledWith('mocked-user-permissions');
    });
  });
});

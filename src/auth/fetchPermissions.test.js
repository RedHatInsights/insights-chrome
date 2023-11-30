import mockedRbac from '../../testdata/rbacAccess.json';

jest.mock('./rbac', () => () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockedRbac = require('../../testdata/rbacAccess.json');
  return {
    getPrincipalAccess: () => {
      global.rbacApiCalled++;
      return Promise.resolve(mockedRbac);
    },
  };
});

import { createFetchPermissionsWatcher } from './fetchPermissions';

describe('fetchPermissions', () => {
  let fetchPermissions;
  let getUser = jest.fn().mockImplementation(() =>
    Promise.resolve({
      identity: {
        // eslint-disable-next-line camelcase
        account_number: '0',
        type: 'User',
        org_id: '123',
      },
      entitlements: {
        insights: {
          // eslint-disable-next-line camelcase
          is_entitled: true,
        },
      },
    })
  );
  beforeEach(() => {
    fetchPermissions = createFetchPermissionsWatcher(getUser);
    global.rbacApiCalled = 0;
  });

  afterAll(() => {
    delete global.rbacApiCalled;
  });

  it('should send all the paginated data as array', async () => {
    const data = fetchPermissions('uSeRtOkEn');
    expect.assertions(1);
    return data.then((permissions) => expect(permissions).toEqual(mockedRbac.data));
  });

  it('should send the data as array', async () => {
    const data = fetchPermissions('uSeRtOkEn');
    expect.assertions(1);
    return data.then((permissions) => expect(permissions).toEqual(mockedRbac.data));
  });

  it('should cache results', async () => {
    await fetchPermissions('uSeRtOkEn', 'sources');

    expect(global.rbacApiCalled).toEqual(1);

    await fetchPermissions('uSeRtOkEn', 'sources');

    expect(global.rbacApiCalled).toEqual(1);

    await fetchPermissions('uSeRtOkEn', 'inventory');

    expect(global.rbacApiCalled).toEqual(2);
  });

  it('should not cache results', async () => {
    const bypasCache = true;

    await fetchPermissions('uSeRtOkEn', 'sources', bypasCache);

    expect(global.rbacApiCalled).toEqual(1);

    await fetchPermissions('uSeRtOkEn', 'sources', bypasCache);

    expect(global.rbacApiCalled).toEqual(2);
  });
});

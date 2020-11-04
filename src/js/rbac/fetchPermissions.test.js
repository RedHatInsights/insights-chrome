import mockedRbac from '../../../testdata/rbacAccess.json';
jest.mock('./rbac', () => () => {
  const mockedRbac = require('../../../testdata/rbacAccess.json');
  return {
    getPrincipalAccess: () => Promise.resolve(mockedRbac),
  };
});

import { createFetchPermissionsWatcher } from './fetchPermissions';

jest.mock('../jwt/jwt');

describe('fetchPermissions', () => {
  let fetchPermissions;
  beforeEach(() => {
    const chromeInstance = { cache: { getItem: () => undefined, setItem: () => undefined } };
    fetchPermissions = createFetchPermissionsWatcher(chromeInstance);
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

  it('should not call any rbac', async () => {
    const previousGetBundle = global.insights.chrome.getBundle;
    global.window.insights.chrome.getBundle = () => 'openshift';
    const data = await fetchPermissions('uSeRtOkEn');
    expect(data).not.toEqual(mockedRbac.data);
    global.window.insights.chrome.getBundle = previousGetBundle;
  });
});

import mockedRbac from '../../../testdata/rbacAccess.json';
jest.mock('./rbac', () => () => {
    const mockedRbac = require('../../../testdata/rbacAccess.json');
    return ({
        getPrincipalAccess: () => Promise.resolve(mockedRbac)
    });
});

import { fetchPermissions } from './fetchPermissions';
import './rbac';

it('should send all the paginated data as array', async () => {
    const data = fetchPermissions('uSeRtOkEn');
    expect.assertions(1);
    return data.then(permissions => expect(permissions).toEqual(mockedRbac.data));
});

it('should send the data as array', async () => {
    const data = fetchPermissions('uSeRtOkEn');
    expect.assertions(1);
    return data.then(permissions => expect(permissions).toEqual(mockedRbac.data));
});

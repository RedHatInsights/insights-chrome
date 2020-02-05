import { fetchPermissions } from './fetchPermissions';
import { mock } from '../../__mocks__/rbacApi';
import mockedRbac from '../../../testdata/rbacAccess.json';

it('should send all the paginated data as array', async () => {
    mock.onGet('/api/rbac/v1/access/?application=*&limit=25').reply(200, mockedRbac);
    const data = fetchPermissions('uSeRtOkEn');
    data.then(permissions => expect(permissions).toEqual(mockedRbac.data));
});

it('should send the data as array', async () => {
    mock.onGet('/api/rbac/v1/access/?application=*&limit=50').reply(200, mockedRbac);
    const data = fetchPermissions('uSeRtOkEn');
    data.then(permissions => expect(permissions).toEqual(mockedRbac.data));
});

import { fetchPermissions } from './fetchPermissions';
import { mock } from '../../__mocks__/rbacApi';
import mockedRbac from '../../../testdata/rbacAccess.json';

// jest.mock('axios');

it('should send the data as array', async () => {
    mock.onGet('/api/rbac/v1/access/?application=*&limit=25').reply(200, mockedRbac);
    const data = await fetchPermissions('uSeRtOkEn');
    expect(mock.history.get.length).toBe(1);
    data.then(permissions => expect(permissions).toEqual(mockedRbac.data));
});

// it('should send the data as JSON', async () => {
//     axios.get.mockResolvedValue(mockedRbac.data);

//     const data = await fetchPermissions('uSeRtOkEn').expect(200,done);
//     // console.log(mockedRbac.data)

//     data.then(permissions => expect(permissions).toEqual(mockedRbac.data));
// }, 10000);
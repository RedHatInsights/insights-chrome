import { AccessApi } from '@redhat-cloud-services/rbac-client';
import rbac from './rbac';

describe('rbac', () => {
  it('should initialize the rbac client', () => {
    const client = rbac();
    expect(client instanceof AccessApi).toBe(true);
    expect(client).toHaveProperty('basePath', '/api/rbac/v1');
  });

  it('rbac client should use interceptor to extract the response data', async () => {
    const client = rbac();
    // axios automatically wraps the response in an object with key `data`
    // we have and interceptor that extracts the data from the response automatically
    jest.spyOn(client, 'getPrincipalAccess').mockResolvedValue({
      foo: 'data',
    } as any);
    const unpackedResponse = await client.getPrincipalAccess('123');
    expect(unpackedResponse).toEqual({ foo: 'data' });
  });
});

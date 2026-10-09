import axios from 'axios';
import { fetchOrgOptIn, resetOrgOptInCache } from './orgOptInApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('orgOptInApi', () => {
  beforeEach(() => {
    resetOrgOptInCache();
    mockedAxios.get.mockReset();
  });

  test('returns true when v2_opted_in is true', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: true } });
    const result = await fetchOrgOptIn('org-123');
    expect(result).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/rbac/v1/tenant/opt-in/', { timeout: 10_000 });
  });

  test('returns false when v2_opted_in is false', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: false } });
    const result = await fetchOrgOptIn('org-123');
    expect(result).toBe(false);
  });

  test('returns null on network error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    const result = await fetchOrgOptIn('org-123');
    expect(result).toBeNull();
  });

  test('returns null for empty identityKey', async () => {
    const result = await fetchOrgOptIn('');
    expect(result).toBeNull();
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  test('returns null for malformed response (missing v2_opted_in)', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { something_else: true } });
    const result = await fetchOrgOptIn('org-123');
    expect(result).toBeNull();
  });

  test('returns null for malformed response (non-boolean v2_opted_in)', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: 'yes' } });
    const result = await fetchOrgOptIn('org-123');
    expect(result).toBeNull();
  });

  test('caches successful result for same identity', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: true } });
    await fetchOrgOptIn('org-123');
    const result = await fetchOrgOptIn('org-123');
    expect(result).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('does not cache failure — allows retry', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('timeout'));
    const first = await fetchOrgOptIn('org-123');
    expect(first).toBeNull();

    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: true } });
    const second = await fetchOrgOptIn('org-123');
    expect(second).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test('invalidates cache on identity change', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: true } });
    await fetchOrgOptIn('org-123');

    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: false } });
    const result = await fetchOrgOptIn('org-456');
    expect(result).toBe(false);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test('deduplicates concurrent requests for same identity', async () => {
    let resolveRequest!: (value: { data: { v2_opted_in: boolean } }) => void;
    mockedAxios.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    const p1 = fetchOrgOptIn('org-123');
    const p2 = fetchOrgOptIn('org-123');

    resolveRequest({ data: { v2_opted_in: true } });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('identity change during inflight invalidates stale request', async () => {
    let resolveFirst!: (value: { data: { v2_opted_in: boolean } }) => void;
    mockedAxios.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      })
    );

    // Start request for old identity (will be invalidated)
    fetchOrgOptIn('org-old');

    // Identity changes — new request for different org
    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: false } });
    const p2 = fetchOrgOptIn('org-new');

    // Old request resolves after identity change
    resolveFirst({ data: { v2_opted_in: true } });

    const r2 = await p2;
    expect(r2).toBe(false);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test('stale request does not overwrite newer cached result', async () => {
    let resolveOld!: (value: { data: { v2_opted_in: boolean } }) => void;
    mockedAxios.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      })
    );

    // Start request for org-old
    const pOld = fetchOrgOptIn('org-old');

    // Identity changes — new request for org-new resolves first
    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: false } });
    const pNew = fetchOrgOptIn('org-new');
    const rNew = await pNew;
    expect(rNew).toBe(false);

    // Old request resolves after — should NOT overwrite the cache
    resolveOld({ data: { v2_opted_in: true } });
    const rOld = await pOld;
    // Old request returns its own value but cache belongs to org-new
    expect(rOld).toBe(true);

    // Verify cache still serves org-new's result
    const cached = await fetchOrgOptIn('org-new');
    expect(cached).toBe(false);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test('resetOrgOptInCache clears cache and allows new request', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: true } });
    await fetchOrgOptIn('org-123');

    resetOrgOptInCache();

    mockedAxios.get.mockResolvedValueOnce({ data: { v2_opted_in: false } });
    const result = await fetchOrgOptIn('org-123');
    expect(result).toBe(false);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });
});

import { act, renderHook, waitFor } from '@testing-library/react';
import useOramaSearch from './useOramaSearch';

const schema = {
  title: 'string' as const,
  description: 'string' as const,
  path: 'string' as const,
};

const testData = [
  { title: 'Get Users', description: 'Retrieve a list of all users in the system', path: '/api/v1/users' },
  { title: 'Create User', description: 'Create a new user account', path: '/api/v1/users' },
  { title: 'Get Clusters', description: 'List all OpenShift clusters', path: '/api/v1/clusters' },
  { title: 'Delete Subscription', description: 'Remove a subscription from the system', path: '/api/v1/subscriptions' },
];

describe('useOramaSearch', () => {
  it('should return isReady false when no data is provided', () => {
    const { result } = renderHook(() => useOramaSearch(undefined, schema));
    expect(result.current.isReady).toBe(false);
  });

  it('should return isReady false for empty data', async () => {
    const { result } = renderHook(() => useOramaSearch([], schema));
    expect(result.current.isReady).toBe(false);
  });

  it('should become ready after data is provided', async () => {
    const { result } = renderHook(() => useOramaSearch(testData, schema));
    await waitFor(() => expect(result.current.isReady).toBe(true));
  });

  it('should return matching results for a search term', async () => {
    const { result } = renderHook(() => useOramaSearch(testData, schema));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let results: Awaited<ReturnType<typeof result.current.query>> = [];
    await act(async () => {
      results = await result.current.query('users');
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.document.title === 'Get Users')).toBe(true);
  });

  it('should return empty results for non-matching term', async () => {
    const { result } = renderHook(() => useOramaSearch(testData, schema));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let results: Awaited<ReturnType<typeof result.current.query>> = [];
    await act(async () => {
      results = await result.current.query('xyznonexistent');
    });

    expect(results).toHaveLength(0);
  });

  it('should return empty results when not ready', async () => {
    const { result } = renderHook(() => useOramaSearch(undefined, schema));

    let results: Awaited<ReturnType<typeof result.current.query>> = [];
    await act(async () => {
      results = await result.current.query('users');
    });

    expect(results).toHaveLength(0);
  });

  it('should support fuzzy matching', async () => {
    const { result } = renderHook(() => useOramaSearch(testData, schema));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let results: Awaited<ReturnType<typeof result.current.query>> = [];
    await act(async () => {
      results = await result.current.query('usrs');
    });

    expect(results.length).toBeGreaterThan(0);
  });

  it('should re-index when data changes', async () => {
    const { result, rerender } = renderHook(({ data }) => useOramaSearch(data, schema), {
      initialProps: { data: testData },
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    const newData = [{ title: 'New Endpoint', description: 'A brand new endpoint', path: '/api/v2/new' }];
    rerender({ data: newData });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let results: Awaited<ReturnType<typeof result.current.query>> = [];
    await act(async () => {
      results = await result.current.query('brand new');
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].document.title).toBe('New Endpoint');
  });

  it('should respect custom search options', async () => {
    const { result } = renderHook(() => useOramaSearch(testData, schema));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let results: Awaited<ReturnType<typeof result.current.query>> = [];
    await act(async () => {
      results = await result.current.query('users', { limit: 1, properties: ['title'] });
    });

    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('should handle indexing errors gracefully', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const badSchema = { title: 'number' as const };
    const badData = [{ title: 'not a number' }];
    const { result } = renderHook(() => useOramaSearch(badData as any, badSchema));

    await new Promise((r) => setTimeout(r, 100));
    expect(result.current.query).toBeDefined();
    warnSpy.mockRestore();
  });
});

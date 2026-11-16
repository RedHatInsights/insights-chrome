import { ReleaseEnv } from '@redhat-cloud-services/types/index.js';
import { consoleSearch } from './consoleSearch';
import { HydraSearchError } from './hydraSearch';
import { searchAPI } from './searchAPI';

jest.mock('./consoleSearch', () => ({ consoleSearch: jest.fn() }));

describe('searchAPI.query()', () => {
  beforeEach(() => {
    (consoleSearch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the results of the active search backend', async () => {
    const results = [{ id: 'a', title: 'A', description: '', bundleTitle: '', pathname: '/a' }];
    (consoleSearch as jest.Mock).mockResolvedValue({ results, source: 'hydra' });
    await expect(searchAPI.query('foo', 'services', ReleaseEnv.PREVIEW)).resolves.toBe(results);
    expect(consoleSearch).toHaveBeenCalledWith(expect.objectContaining({ term: 'foo', type: 'services', env: ReleaseEnv.PREVIEW }));
  });

  it('resolves with no results when the backend fails, so tenant apps never see a rejection', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (consoleSearch as jest.Mock).mockRejectedValue(new HydraSearchError('down', 'http'));
    await expect(searchAPI.query('foo', 'services')).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalled();
  });
});

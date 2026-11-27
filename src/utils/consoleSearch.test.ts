import { create } from '@orama/orama';
import { ReleaseEnv } from '@redhat-cloud-services/types/index.js';
import { entrySchema } from '../state/atoms/localSearchAtom';
import { consoleSearch } from './consoleSearch';
import { HydraSearchError, hydraQuery, isHydraSearchEnabled } from './hydraSearch';
import { localQuery } from './localSearch';

jest.mock('./hydraSearch', () => {
  const actual = jest.requireActual('./hydraSearch');
  return { ...actual, hydraQuery: jest.fn(), isHydraSearchEnabled: jest.fn() };
});

jest.mock('./localSearch', () => ({
  ...jest.requireActual('./localSearch'),
  localQuery: jest.fn(),
}));

describe('consoleSearch()', () => {
  const db = create({ schema: entrySchema });
  const localResults = [{ id: 'local', title: 'Local', description: '', bundleTitle: '', pathname: '/local' }];
  const hydraResults = [{ id: 'hydra', title: 'Hydra', description: '', bundleTitle: '', pathname: '/hydra' }];

  beforeEach(() => {
    (localQuery as jest.Mock).mockReset().mockResolvedValue(localResults);
    (hydraQuery as jest.Mock).mockReset().mockResolvedValue(hydraResults);
    (isHydraSearchEnabled as jest.Mock).mockReset().mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the local index when the flag is off', async () => {
    await expect(consoleSearch({ db, term: 'foo' })).resolves.toEqual({ results: localResults, source: 'local' });
    expect(localQuery).toHaveBeenCalledWith(db, 'foo', ReleaseEnv.STABLE, 'services');
    expect(hydraQuery).not.toHaveBeenCalled();
  });

  it('uses Hydra when the flag is on', async () => {
    (isHydraSearchEnabled as jest.Mock).mockReturnValue(true);
    const signal = new AbortController().signal;
    await expect(consoleSearch({ db, term: 'foo', env: ReleaseEnv.PREVIEW, signal })).resolves.toEqual({ results: hydraResults, source: 'hydra' });
    expect(hydraQuery).toHaveBeenCalledWith('foo', { env: ReleaseEnv.PREVIEW, signal });
    expect(localQuery).not.toHaveBeenCalled();
  });

  it('keeps non-service types on the local index', async () => {
    (isHydraSearchEnabled as jest.Mock).mockReturnValue(true);
    await expect(consoleSearch({ db, term: 'foo', type: 'quickstarts' })).resolves.toEqual({ results: localResults, source: 'local' });
    expect(hydraQuery).not.toHaveBeenCalled();
  });

  it('rejects when Hydra fails instead of falling back to the local index', async () => {
    (isHydraSearchEnabled as jest.Mock).mockReturnValue(true);
    const error = new HydraSearchError('down', 'http');
    (hydraQuery as jest.Mock).mockRejectedValue(error);
    await expect(consoleSearch({ db, term: 'foo' })).rejects.toBe(error);
    expect(localQuery).not.toHaveBeenCalled();
  });

  it('rejects on caller aborts', async () => {
    (isHydraSearchEnabled as jest.Mock).mockReturnValue(true);
    const abortError = new DOMException('aborted', 'AbortError');
    (hydraQuery as jest.Mock).mockRejectedValue(abortError);
    await expect(consoleSearch({ db, term: 'foo' })).rejects.toBe(abortError);
    expect(localQuery).not.toHaveBeenCalled();
  });
});

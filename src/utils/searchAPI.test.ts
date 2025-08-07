import { SearchEntry, createSearchAPI } from './searchAPI';
import { ReleaseEnv } from '../@types/types.d';

// Mock Orama functions
const mockSearch = jest.fn().mockImplementation(() => ({
  hits: [
    {
      document: {
        id: 'help-1',
        title: 'Getting Started',
        description: 'Learn how to get started with the platform',
        bundleTitle: 'Help',
        pathname: '/help/getting-started',
        type: 'help-docs',
      },
    },
  ],
}));

const mockCreate = jest.fn().mockResolvedValue({});
const mockInsert = jest.fn().mockResolvedValue(undefined);

jest.mock('@orama/orama', () => ({
  create: (...args: unknown[]) => mockCreate(...args),
  insert: (...args: unknown[]) => mockInsert(...args),
  search: (...args: unknown[]) => mockSearch(...args),
}));

// Mock other dependencies
jest.mock('./isNavItemVisible', () => ({
  evaluateVisibility: jest.fn().mockResolvedValue({ isHidden: false }),
}));

jest.mock('./localSearch', () => {
  return {
    localQuery: jest.fn().mockImplementation(async () => [
      {
        title: '<mark>Global</mark> Result',
        description: 'A result from global search',
        bundleTitle: 'Global',
        pathname: '/global',
        id: 'global-1',
      },
    ]),
  };
});

const mockDb = {};
jest.mock('../state/atoms/localSearchAtom', () => {
  return {
    __esModule: true,
    SearchPermissions: new Map(),
    SearchPermissionsCache: new Map(),
    get asyncLocalOrama() {
      return Promise.resolve(mockDb);
    },
  };
});

describe('Search API', () => {
  let searchAPI: ReturnType<typeof createSearchAPI>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    // Clear all maps
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SearchPermissions, SearchPermissionsCache } = require('../state/atoms/localSearchAtom');
      SearchPermissions.clear();
      SearchPermissionsCache.clear();
    });
    // Create fresh instance with test mode enabled
    searchAPI = createSearchAPI(true);
    // Reset the store state
    const store = (searchAPI as any)._store;
    store.databases.clear();
    store.dataCache.clear();
  });

  const mockHelpDocs: SearchEntry[] = [
    {
      id: 'help-1',
      title: 'Getting Started',
      description: 'Learn how to get started with the platform',
      pathname: '/help/getting-started',
      bundleTitle: 'Help',
      type: 'help-docs',
    },
    {
      id: 'help-2',
      title: 'Advanced Features',
      description: 'Explore advanced features of the platform',
      pathname: '/help/advanced',
      bundleTitle: 'Help',
      type: 'help-docs',
    },
  ];

  const mockQuickstarts: SearchEntry[] = [
    {
      id: 'qs-1',
      title: 'First Steps',
      description: 'Your first quickstart guide',
      pathname: '/quickstarts/first-steps',
      bundleTitle: 'Quickstarts',
      type: 'quickstarts',
    },
  ];

  describe('fillStore', () => {
    it('should store help documentation data', async () => {
      await searchAPI.fillStore('help-docs', mockHelpDocs);

      const cachedData = searchAPI.getCachedData('help-docs');
      expect(cachedData).toEqual(mockHelpDocs);
      expect(mockCreate).toHaveBeenCalledWith({ schema: expect.any(Object) });
      expect(mockInsert).toHaveBeenCalledTimes(mockHelpDocs.length);
    });

    it('should store quickstart data separately', async () => {
      await searchAPI.fillStore('help-docs', mockHelpDocs);
      await searchAPI.fillStore('quickstarts', mockQuickstarts);

      const helpDocsData = searchAPI.getCachedData('help-docs');
      const quickstartsData = searchAPI.getCachedData('quickstarts');

      expect(helpDocsData).toEqual(mockHelpDocs);
      expect(quickstartsData).toEqual(mockQuickstarts);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAvailableTypes', () => {
    it('should return available data types', async () => {
      await searchAPI.fillStore('help-docs', mockHelpDocs);
      await searchAPI.fillStore('quickstarts', mockQuickstarts);

      const types = searchAPI.getAvailableTypes();
      expect(types).toContain('help-docs');
      expect(types).toContain('quickstarts');
    });

    it('should return empty array when no data is stored', () => {
      const types = searchAPI.getAvailableTypes();
      expect(types).toEqual([]);
    });
  });

  describe('clearType', () => {
    it('should clear data for specific type', async () => {
      await searchAPI.fillStore('help-docs', mockHelpDocs);
      await searchAPI.fillStore('quickstarts', mockQuickstarts);

      await searchAPI.clearType('help-docs');

      const helpDocsData = searchAPI.getCachedData('help-docs');
      const quickstartsData = searchAPI.getCachedData('quickstarts');

      expect(helpDocsData).toBeUndefined();
      expect(quickstartsData).toEqual(mockQuickstarts);
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      await searchAPI.fillStore('help-docs', mockHelpDocs);
    });

    it('should query specific data type', async () => {
      const results = await searchAPI.query('getting started', 'help-docs');

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'help-1',
            title: 'Getting Started',
          }),
        ])
      );
      expect(mockSearch).toHaveBeenCalledWith(expect.anything(), {
        term: 'getting started',
        threshold: 0.5,
        tolerance: 1.5,
        properties: ['title', 'description', 'altTitle'],
        boost: expect.any(Object),
        limit: 10,
      });
    });

    it('should respect limit parameter', async () => {
      const results = await searchAPI.query('help', 'help-docs', ReleaseEnv.STABLE, 1);
      expect(results.length).toBeLessThanOrEqual(1);
      expect(mockSearch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ limit: 1 }));
    });

    it('should use global search when no type specified', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { localQuery } = require('./localSearch');

      const results = await searchAPI.query('test');

      // Verify we're using localQuery with the correct parameters
      expect(localQuery).toHaveBeenCalledWith(mockDb, 'test', ReleaseEnv.STABLE, false);
      // Verify we're getting the expected results
      expect(results).toEqual([
        {
          title: '<mark>Global</mark> Result',
          description: 'A result from global search',
          bundleTitle: 'Global',
          pathname: '/global',
          id: 'global-1',
          type: 'legacy',
        },
      ]);
    });
  });

  describe('getCachedData', () => {
    it('should return cached data for existing type', async () => {
      await searchAPI.fillStore('help-docs', mockHelpDocs);

      const cachedData = searchAPI.getCachedData('help-docs');
      expect(cachedData).toEqual(mockHelpDocs);
    });

    it('should return undefined for non-existing type', () => {
      const cachedData = searchAPI.getCachedData('non-existing');
      expect(cachedData).toBeUndefined();
    });
  });
});
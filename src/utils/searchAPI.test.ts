import { SearchStore } from './searchAPI';
import type { SearchEntry } from '@redhat-cloud-services/types';

// Mock dependencies
const mockDb = {};

// Import mocked modules
import { evaluateVisibility } from './isNavItemVisible';
import { localQuery } from './localSearch';

jest.mock('./isNavItemVisible', () => ({
  evaluateVisibility: jest.fn().mockResolvedValue({ isHidden: false }),
}));

jest.mock('./localSearch', () => ({
  localQuery: jest.fn().mockImplementation(async () => [
    {
      title: '<mark>Global</mark> Result',
      description: 'A result from global search',
      bundleTitle: 'Global',
      pathname: '/global',
      id: 'global-1',
    },
  ]),
}));

jest.mock('../state/atoms/localSearchAtom', () => ({
  __esModule: true,
  SearchPermissions: new Map(),
  SearchPermissionsCache: new Map(),
  get asyncLocalOrama() {
    return Promise.resolve(mockDb);
  },
}));

// 1. Mock @orama/orama functions
const mockOramaFunctions = {
  create: jest.fn().mockResolvedValue({}),
  insert: jest.fn().mockResolvedValue(undefined),
  search: jest.fn().mockImplementation(() => {
    // Return different results based on call order
    const lastQueriedType = mockOramaFunctions.search.mock.calls.length > 1 ? 'legacy' : 'generated';
    return {
      hits: [
        {
          document: {
            id: lastQueriedType === 'generated' ? 'help-1' : 'qs-1',
            title: lastQueriedType === 'generated' ? 'Getting Started' : 'First Steps',
            description: lastQueriedType === 'generated' ? 'Learn how to get started with the platform' : 'Your first quickstart guide',
            bundleTitle: lastQueriedType === 'generated' ? 'Help' : 'Quickstarts',
            pathname: lastQueriedType === 'generated' ? '/help/getting-started' : '/quickstarts/first-steps',
            type: lastQueriedType,
          },
        },
      ],
    };
  }),
};

jest.mock('@orama/orama', () => ({
  create: (...args: unknown[]) => mockOramaFunctions.create(...args),
  insert: (...args: unknown[]) => mockOramaFunctions.insert(...args),
  search: (...args: unknown[]) => mockOramaFunctions.search(...args),
}));

// 2. Group mock dependencies for easier access in tests
const mockDependencies = {
  visibility: evaluateVisibility as jest.Mock,
  globalSearch: localQuery as jest.Mock,
};

// Test data for different content types
const mockTestData = {
  helpDocs: [
    {
      id: 'help-1',
      title: 'Getting Started',
      description: 'Learn how to get started with the platform',
      uri: '/help/getting-started',
      pathname: '/help/getting-started',
      bundleTitle: 'Help',
      type: 'generated',
    },
    {
      id: 'help-2',
      title: 'Advanced Features',
      description: 'Explore advanced features of the platform',
      uri: '/help/advanced',
      pathname: '/help/advanced',
      bundleTitle: 'Help',
      type: 'generated',
    },
  ] as SearchEntry[],
  quickstarts: [
    {
      id: 'qs-1',
      title: 'First Steps',
      description: 'Your first quickstart guide',
      uri: '/quickstarts/first-steps',
      pathname: '/quickstarts/first-steps',
      bundleTitle: 'Quickstarts',
      type: 'legacy',
    },
  ] as SearchEntry[],
};

// Store instance used across tests
let testStore: SearchStore;

describe('Search API', () => {
  let testSearchAPI: SearchStore;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Suppress console warnings during tests
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Reset all mocks
    jest.clearAllMocks();
    // Reset store dependencies
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SearchPermissions, SearchPermissionsCache } = require('../state/atoms/localSearchAtom');
      SearchPermissions.clear();
      SearchPermissionsCache.clear();
    });

    // Create fresh store instance
    testSearchAPI = new SearchStore(jest.requireActual('jotai').createStore());
    testStore = testSearchAPI;
  });

  afterEach(() => {
    // Restore console.warn
    consoleSpy?.mockRestore();
  });

  describe('Store Operations', () => {
    describe('Direct Store Access', () => {
      it('should manage store state correctly', async () => {
        expect(testStore.getAvailableTypes()).toEqual([]);
        await testStore.fillStore('generated', mockTestData.helpDocs);
        expect(testStore.getAvailableTypes()).toContain('generated');
        await testStore.clearType('generated');
        expect(testStore.getAvailableTypes()).toEqual([]);
      });

      it('should maintain separate stores for different types', async () => {
        await testStore.fillStore('generated', mockTestData.helpDocs);
        await testStore.fillStore('legacy', mockTestData.quickstarts);
        expect(testStore.getCachedData('generated')).toEqual(mockTestData.helpDocs);
        expect(testStore.getCachedData('legacy')).toEqual(mockTestData.quickstarts);
      });
    });

    describe('Store API Interface', () => {
      it('should expose store operations through API', async () => {
        await testSearchAPI.fillStore('generated', mockTestData.helpDocs);
        expect(testSearchAPI.getCachedData('generated')).toEqual(mockTestData.helpDocs);
        expect(testSearchAPI.getAvailableTypes()).toContain('generated');
      });
    });
  });

  describe('Orama Integration', () => {
    beforeEach(async () => {
      await testSearchAPI.fillStore('generated', mockTestData.helpDocs);
    });

    it('should initialize Orama database correctly', async () => {
      await testStore.getDatabase('generated');
      expect(mockOramaFunctions.create).toHaveBeenCalledWith({
        schema: expect.any(Object),
      });
      expect(mockOramaFunctions.insert).toHaveBeenCalledTimes(mockTestData.helpDocs.length);
    });

    it('should use Orama search with correct parameters', async () => {
      await testSearchAPI.query('getting started', 'generated');
      expect(mockOramaFunctions.search).toHaveBeenCalledWith(expect.anything(), {
        term: 'getting started',
        threshold: 0.5,
        tolerance: 1.5,
        properties: ['title', 'description', 'altTitle'],
        boost: expect.any(Object),
        limit: 10,
      });
    });

    it('should handle search limits', async () => {
      const results = await testSearchAPI.query('help', 'generated', 'stable', 1);
      expect(results.length).toBeLessThanOrEqual(1);
      expect(mockOramaFunctions.search).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ limit: 1 }));
    });
  });

  describe('Global Search Integration', () => {
    it('should gracefully handle unavailable global search', async () => {
      const results = await testSearchAPI.query('test');
      // When global search dependencies aren't available, should return empty results
      expect(results).toEqual([]);
    });

    it('should not search other document types when global search unavailable', async () => {
      // Fill store with help docs
      await testSearchAPI.fillStore('generated', mockTestData.helpDocs);
      // Perform global search
      const results = await testSearchAPI.query('Getting Started');
      // Should return empty results when global search isn't available
      expect(results).toEqual([]);
      // Should not have called global search mock due to atom access failure
      expect(mockDependencies.globalSearch).not.toHaveBeenCalled();
    });
  });

  describe('Scalprum Search API Integration', () => {
    it('should expose required search API methods', () => {
      const api = new SearchStore(jest.requireActual('jotai').createStore());
      expect(api).toHaveProperty('fillStore');
      expect(api).toHaveProperty('query');
      expect(api).toHaveProperty('getAvailableTypes');
      expect(typeof api.fillStore).toBe('function');
      expect(typeof api.query).toBe('function');
      expect(typeof api.getAvailableTypes).toBe('function');
    });

    it('should handle help panel data loading', async () => {
      const api = new SearchStore(jest.requireActual('jotai').createStore());
      const helpData = mockTestData.helpDocs;
      await api.fillStore('generated', helpData);
      // Verify data is loaded correctly
      const storedData = api.getCachedData('generated');
      expect(storedData).toEqual(helpData);
      // Verify search works with loaded data
      const results = await api.query('Getting Started', 'generated');
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'help-1',
            title: 'Getting Started',
            type: 'generated',
          }),
        ])
      );
    });

    it('should maintain type isolation in searches', async () => {
      const api = new SearchStore(jest.requireActual('jotai').createStore());
      await api.fillStore('generated', mockTestData.helpDocs);
      await api.fillStore('legacy', mockTestData.quickstarts);

      // Search in generated
      const helpResults = await api.query('guide', 'generated');
      expect(helpResults.length).toBeGreaterThan(0);
      expect(helpResults[0].type).toBe('generated');

      // Search in legacy
      const qsResults = await api.query('guide', 'legacy');
      expect(qsResults.length).toBeGreaterThan(0);
      expect(qsResults[0].type).toBe('legacy');

      // Verify search parameters
      expect(mockOramaFunctions.search).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          term: 'guide',
          threshold: 0.5,
          tolerance: 1.5,
          properties: ['title', 'description', 'altTitle'],
          boost: {
            title: 10,
            altTitle: 5,
            description: 3,
          },
          limit: 10,
        })
      );
    });
  });
});

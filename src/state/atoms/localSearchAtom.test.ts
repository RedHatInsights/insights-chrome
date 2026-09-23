import axios from 'axios';
import localforage from 'localforage';
import { create, search } from '@orama/orama';
import { faker } from '@faker-js/faker';
import { entrySchema, getDB, insertEntry, loadGeneratedSearchIndex } from './localSearchAtom';
import { CACHE_SCHEMA_VERSION } from '../../utils/cacheFetch';
import { CONFIG_SOURCES, resetConfigCacheStatus } from '../../utils/configCacheStatus';

const mockSetItem = jest.fn();
const mockGetItem = jest.fn();

jest.mock('localforage', () => ({
  INDEXEDDB: 'asyncStorage',
  WEBSQL: 'webSQLStorage',
  LOCALSTORAGE: 'localStorageWrapper',
  createInstance: jest.fn(),
}));

jest.mock('../../components/FeatureFlags/unleashClient', () => ({
  getFeatureFlagsError: jest.fn(() => false),
  getUnleashClient: jest.fn(() => ({ isReady: () => true, isEnabled: () => true })),
  unleashClientExists: jest.fn(() => true),
}));

/**
 * getDB() returns a module-level singleton — the same DB instance is shared across
 * all tests in this file. Documents inserted in one test remain visible in later tests.
 */

beforeEach(() => {
  mockSetItem.mockReset().mockResolvedValue(undefined);
  mockGetItem.mockReset().mockResolvedValue(null);
  jest.mocked(localforage.createInstance).mockReturnValue({ setItem: mockSetItem, getItem: mockGetItem } as unknown as LocalForage);
  jest.spyOn(axios, 'get').mockReset();
  resetConfigCacheStatus();
});

afterEach(() => {
  jest.restoreAllMocks();
  resetConfigCacheStatus();
});

describe('loadGeneratedSearchIndex', () => {
  const searchIndex = [{ id: 'insights', href: '/insights', title: 'Insights' }];

  it('caches the generated search index', async () => {
    jest.mocked(axios.get).mockResolvedValue({ data: searchIndex });

    await expect(loadGeneratedSearchIndex()).resolves.toEqual(searchIndex);

    expect(axios.get).toHaveBeenCalledWith('/api/chrome-service/v1/static/search-index-generated.json');
    expect(mockSetItem).toHaveBeenCalledWith(`v${CACHE_SCHEMA_VERSION}:${CONFIG_SOURCES.SEARCH_INDEX}`, expect.objectContaining({ data: searchIndex }));
  });

  it('uses the cached generated search index after an origin failure', async () => {
    jest.mocked(axios.get).mockRejectedValue(new Error('network error'));
    mockGetItem.mockResolvedValue({ data: searchIndex, cachedAt: Date.now() });

    await expect(loadGeneratedSearchIndex()).resolves.toEqual(searchIndex);

    expect(mockGetItem).toHaveBeenCalledWith(`v${CACHE_SCHEMA_VERSION}:${CONFIG_SOURCES.SEARCH_INDEX}`);
  });
});

describe('entrySchema', () => {
  it('defines the expected fields', () => {
    expect(entrySchema).toMatchObject({
      title: 'string',
      description: 'string',
      altTitle: 'string[]',
      descriptionMatch: 'string',
      bundleTitle: 'string',
      pathname: 'string',
      type: 'string',
    });
  });
});

describe('getDB()', () => {
  it('returns an Orama database instance', () => {
    const db = getDB();
    expect(db).toBeDefined();
  });

  it('is a singleton (same reference on second call)', () => {
    const db1 = getDB();
    const db2 = getDB();
    expect(db1).toBe(db2);
  });
});

describe('insertEntry()', () => {
  it('inserts a document without error and it is retrievable', async () => {
    const db = create({ schema: entrySchema });
    const title = faker.commerce.productName();
    const entry = {
      id: faker.string.uuid(),
      title,
      uri: faker.internet.url(),
      pathname: faker.system.filePath(),
      description: faker.commerce.productDescription(),
      bundleTitle: faker.commerce.department(),
      type: 'services' as const,
    };

    await insertEntry(db, entry);

    const results = await search(db, { term: title, properties: ['title'] });
    expect(results.hits.some((hit) => hit.document.title === title)).toBe(true);
  });
});

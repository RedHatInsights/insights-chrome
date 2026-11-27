import axios from 'axios';
import localforage from 'localforage';
import { Orama, create, getByID, search } from '@orama/orama';
import { createStore } from 'jotai';
import { waitFor } from '@testing-library/react';
import { feoLocalizationEnabledAtom, feoMessagesAtom } from './feoLocaleAtom';
import { languageAtom } from './languageAtom';
import { localQuery } from '../../utils/localSearch';
import messages from '../../../testdata/feo-localization/messages.fr.json';
import locales from '../../../testdata/feo-localization/locales.json';
import { faker } from '@faker-js/faker';
import { asyncLocalOrama, entrySchema, insertEntry, insertSearchEntryAtom, loadGeneratedSearchIndex } from './localSearchAtom';
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

describe('localized search index', () => {
  const english = [
    {
      id: 'rbac-stage-users',
      href: '/iam/user-access/users',
      title: 'Users',
      description: 'Manage users in your account',
      alt_title: ['People', 'Accounts', 'a | b'],
    },
  ];
  beforeEach(() => {
    jest.mocked(axios.get).mockImplementation(async (url) => {
      if (String(url).endsWith('locales.json')) return { data: locales };
      if (String(url).endsWith('messages.fr.json')) return { data: messages };
      if (String(url).endsWith('search-index-generated.json')) return { data: english };
      return { data: [] };
    });
  });

  it('keeps the exact English document terms and rebuilds bilingual search only for a catalog change', async () => {
    const store = createStore();
    store.set(feoLocalizationEnabledAtom, true);
    const unsubscribe = store.sub(feoMessagesAtom, () => {});
    const englishDB = await store.get(asyncLocalOrama);
    expect(getByID(englishDB, english[0].id)?.altTitle).toEqual(english[0].alt_title);
    await localQuery(englishDB, 'Users');
    store.set(languageAtom, 'fr');
    await waitFor(() => expect(store.get(feoMessagesAtom)).toEqual(messages));
    const frenchDB = await store.get(asyncLocalOrama);
    expect(frenchDB).not.toBe(englishDB);
    for (const term of ['Users', 'Utilisateurs', 'People', 'Personnes', 'Comptes', 'Manage', 'Gérer', 'a | b']) {
      const result = (await localQuery(frenchDB, term)).find(({ id }) => id === english[0].id)!;
      expect(result.pathname).toBe(english[0].href);
      expect(result.title.replace(/<\/?mark>/g, '')).toBe('Utilisateurs');
      expect(result.description.replace(/<\/?mark>/g, '')).toBe('Gérer les utilisateurs de votre compte');
    }
    store.set(languageAtom, 'en');
    await waitFor(() => expect(store.get(feoMessagesAtom)).toEqual({}));
    const restored = await store.get(asyncLocalOrama);
    expect(getByID(restored, english[0].id)?.altTitle).toEqual(english[0].alt_title);
    for (const term of ['Users', 'People', 'Accounts']) {
      expect((await localQuery(restored, term))[0].title.replace(/<\/?mark>/g, '')).toBe('Users');
    }
    unsubscribe();
  });

  it('retains remote inserts made during the initial asset load and isolates stores', async () => {
    let release!: (response: { data: typeof english }) => void;
    jest.mocked(axios.get).mockImplementation(async (url) =>
      String(url).endsWith('search-index-generated.json')
        ? new Promise((resolve) => {
            release = resolve;
          })
        : { data: [] }
    );
    const store = createStore();
    const building = store.get(asyncLocalOrama);
    const inserted = store.set(insertSearchEntryAtom, {
      id: 'early-remote',
      title: 'Early remote',
      description: 'Registered during asset loading',
      pathname: '/early',
      uri: '/early',
      bundleTitle: 'Remote',
      type: 'services',
    });
    await waitFor(() => expect(release).toBeDefined());
    release({ data: english });
    await inserted;
    expect(store.get(asyncLocalOrama)).toBe(building);
    expect(getByID(await building, 'early-remote')?.title).toBe('Early remote');
    jest.mocked(axios.get).mockResolvedValue({ data: [] });
    expect(getByID(await createStore().get(asyncLocalOrama), 'early-remote')).toBeUndefined();
  });

  it.each([true, false])('snapshots caller-owned entries and aliases before insertion/replay (mutate while pending: %s)', async (mutateWhilePending) => {
    const store = createStore();
    store.set(feoLocalizationEnabledAtom, true);
    const unsubscribe = store.sub(feoMessagesAtom, () => {});
    const entry = {
      id: 'remote-a',
      title: 'Remote A',
      description: 'Remote description',
      pathname: '/remote/a',
      uri: '/remote/a',
      bundleTitle: 'Remote',
      altTitle: ['Alias A'],
      type: 'services' as const,
    };
    const insertA = store.set(insertSearchEntryAtom, entry);
    if (!mutateWhilePending) await insertA;
    Object.assign(entry, { id: 'remote-b', title: 'Remote B', pathname: '/remote/b', uri: '/remote/b' });
    entry.altTitle[0] = 'Alias B';
    await insertA;
    await store.set(insertSearchEntryAtom, entry);
    entry.title = 'Later caller mutation';
    entry.altTitle.push('Later alias');
    // Duplicate IDs retain the first accepted record, not the caller's edits.
    await store.set(insertSearchEntryAtom, entry);
    const assertRecords = (db: Orama<typeof entrySchema>) => {
      expect(getByID(db, 'remote-a')).toMatchObject({ title: 'Remote A', pathname: '/remote/a', altTitle: ['Alias A'] });
      expect(getByID(db, 'remote-b')).toMatchObject({ title: 'Remote B', pathname: '/remote/b', altTitle: ['Alias B'] });
    };
    assertRecords(await store.get(asyncLocalOrama));
    store.set(languageAtom, 'fr');
    await waitFor(() => expect(store.get(feoMessagesAtom)).toEqual(messages));
    assertRecords(await store.get(asyncLocalOrama));
    unsubscribe();
  });

  it('inserts remote entries without rebuilding or suspending and retains them through locale changes', async () => {
    const store = createStore();
    store.set(feoLocalizationEnabledAtom, true);
    const unsubscribe = store.sub(feoMessagesAtom, () => {});
    const initialPromise = store.get(asyncLocalOrama);
    const initialDB = await initialPromise;
    for (let i = 0; i < 3; i++) {
      await store.set(insertSearchEntryAtom, {
        id: `remote-${i}`,
        title: `Remote ${i}`,
        description: 'Remote description',
        pathname: `/remote/${i}`,
        uri: `/remote/${i}`,
        bundleTitle: 'Remote',
        type: 'services',
      });
      expect(store.get(asyncLocalOrama)).toBe(initialPromise);
      expect(getByID(initialDB, `remote-${i}`)?.title).toBe(`Remote ${i}`);
    }
    store.set(languageAtom, 'fr');
    await waitFor(() => expect(store.get(feoMessagesAtom)).toEqual(messages));
    const localized = await store.get(asyncLocalOrama);
    expect(localized).not.toBe(initialDB);
    for (let i = 0; i < 3; i++) expect(getByID(localized, `remote-${i}`)?.title).toBe(`Remote ${i}`);
    unsubscribe();
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

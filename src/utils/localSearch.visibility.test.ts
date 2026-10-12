import { create } from '@orama/orama';
import type { Orama } from '@orama/orama';
import { ChromeUser, ReleaseEnv } from '@redhat-cloud-services/types/index.js';
import * as Sentry from '@sentry/react';
import { SearchPermissions, SearchPermissionsCache, entrySchema, insertEntry } from '../state/atoms/localSearchAtom';
import { initializeVisibilityFunctions } from './VisibilitySingleton';
import { localQuery } from './localSearch';

jest.mock('@sentry/react', () => ({ captureMessage: jest.fn() }));
jest.mock('@scalprum/core', () => ({ initSharedScope: jest.fn(), getSharedScope: jest.fn().mockReturnValue({}) }));

const user: ChromeUser = {
  entitlements: {},
  identity: {
    account_number: '0',
    type: 'User',
    org_id: '123',
    user: {
      username: 'test-user',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      is_internal: false,
      is_org_admin: true,
      locale: 'en',
    },
  },
};

describe('localQuery visibility failure recovery', () => {
  let db: Orama<typeof entrySchema>;
  let term: string;
  let alternateTerm: string;
  let testIndex = 0;
  const getUser = jest.fn(() => Promise.resolve(user));
  const cacheKey = (id: string) => `${ReleaseEnv.STABLE}-${id}`;

  const addEntry = async (id: string, restricted = false) => {
    SearchPermissions.set(id, restricted ? [{ method: 'isOrgAdmin', args: [] }] : []);
    await insertEntry(db, {
      id,
      title: `${term} ${alternateTerm}`,
      uri: `/settings/${id}`,
      pathname: `/settings/${id}`,
      description: 'Test service',
      bundleTitle: 'Settings',
      type: 'services',
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    SearchPermissions.clear();
    SearchPermissionsCache.clear();
    db = create({ schema: entrySchema });
    // Query results are module-scoped; distinct terms keep tests independent
    // without adding a production cache-reset API just for tests.
    testIndex += 1;
    term = `recovery${testIndex}`;
    alternateTerm = `alternate${testIndex}`;
    getUser.mockReset().mockResolvedValue(user);
    initializeVisibilityFunctions({
      getUser,
      getToken: jest.fn(),
      getUserPermissions: jest.fn(),
      isPreview: false,
    });
  });

  afterEach(() => {
    SearchPermissions.clear();
    SearchPermissionsCache.clear();
  });

  it.each(['throw', 'reject'])('retries the same query after a visibility %s while preserving healthy results', async (failure) => {
    await addEntry('recovering', true);
    await addEntry('healthy');
    getUser.mockImplementationOnce(() => {
      if (failure === 'throw') throw new Error('Temporary user lookup failure');
      return Promise.reject(new Error('Temporary user lookup failure'));
    });

    const first = await localQuery(db, term);
    expect(first.map(({ id }) => id)).toEqual(['healthy']);
    expect(SearchPermissionsCache.get(cacheKey('healthy'))).toBe(false);
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);

    const recovered = await localQuery(db, term);
    expect(recovered.map(({ id }) => id).sort()).toEqual(['healthy', 'recovering']);
    expect(getUser).toHaveBeenCalledTimes(2);
    expect(SearchPermissionsCache.get(cacheKey('recovering'))).toBe(false);

    // Once evaluation succeeds, ordinary query-result caching still applies.
    expect(await localQuery(db, term)).toBe(recovered);
    expect(getUser).toHaveBeenCalledTimes(2);
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
  });

  it('does not poison another query with the failed item permission result', async () => {
    await addEntry('recovering', true);
    getUser.mockRejectedValueOnce(new Error('Temporary user lookup failure'));

    expect(await localQuery(db, term)).toEqual([]);
    expect(SearchPermissionsCache.has(cacheKey('recovering'))).toBe(false);

    const recovered = await localQuery(db, alternateTerm);
    expect(recovered.map(({ id }) => id)).toEqual(['recovering']);
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it('does not cache an empty query result caused by a failed visibility check', async () => {
    await addEntry('recovering', true);
    getUser.mockRejectedValueOnce(new Error('Temporary user lookup failure'));

    expect(await localQuery(db, term)).toEqual([]);
    const recovered = await localQuery(db, term);

    expect(recovered.map(({ id }) => id)).toEqual(['recovering']);
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it('keeps retrying while a visibility dependency remains unavailable', async () => {
    await addEntry('recovering', true);
    await addEntry('healthy');
    getUser.mockRejectedValue(new Error('User lookup still unavailable'));

    for (let attempt = 0; attempt < 2; attempt += 1) {
      expect((await localQuery(db, term)).map(({ id }) => id)).toEqual(['healthy']);
      expect(SearchPermissionsCache.has(cacheKey('recovering'))).toBe(false);
    }
    expect(getUser).toHaveBeenCalledTimes(2);

    getUser.mockResolvedValue(user);
    expect((await localQuery(db, term)).map(({ id }) => id).sort()).toEqual(['healthy', 'recovering']);
  });

  it('continues caching ordinary permission denials without treating them as errors', async () => {
    await addEntry('denied', true);
    await addEntry('healthy');
    getUser.mockResolvedValue({ ...user, identity: { ...user.identity, user: { ...user.identity.user!, is_org_admin: false } } });

    const results = await localQuery(db, term);
    expect(results.map(({ id }) => id)).toEqual(['healthy']);
    expect(SearchPermissionsCache.get(cacheKey('denied'))).toBe(true);
    expect(await localQuery(db, term)).toBe(results);

    // A different query uses the cached denial instead of repeating the check.
    expect((await localQuery(db, alternateTerm)).map(({ id }) => id)).toEqual(['healthy']);
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});

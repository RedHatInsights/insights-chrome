import { create, search } from '@orama/orama';
import { faker } from '@faker-js/faker';
import { entrySchema, getDB, insertEntry } from './localSearchAtom';

/**
 * getDB() returns a module-level singleton — the same DB instance is shared across
 * all tests in this file. Documents inserted in one test remain visible in later tests.
 */

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
  it('returns an Orama database instance', async () => {
    const db = await getDB();
    expect(db).toBeDefined();
  });

  it('is a singleton (same reference on second call)', async () => {
    const db1 = await getDB();
    const db2 = await getDB();
    expect(db1).toBe(db2);
  });
});

describe('insertEntry()', () => {
  it('inserts a document without error and it is retrievable', async () => {
<<<<<<< Updated upstream
    const db = await getDB();
=======
    const db = create({ schema: entrySchema });
>>>>>>> Stashed changes
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

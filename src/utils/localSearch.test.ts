import { create } from '@orama/orama';
import type { Orama } from '@orama/orama';
import { faker } from '@faker-js/faker';
import { ReleaseEnv, SearchDataType } from '@redhat-cloud-services/types/index.js';
import { SearchPermissions, entrySchema, insertEntry } from '../state/atoms/localSearchAtom';
import { localQuery } from './localSearch';

jest.mock('./isNavItemVisible', () => ({
  evaluateVisibility: jest.fn().mockResolvedValue({ isHidden: false }),
}));

/**
 * Each test gets a fresh in-memory DB via beforeEach so inserted documents
 * do not bleed between tests.
 */

describe('localQuery()', () => {
  let db: Orama<typeof entrySchema>;
  const serviceType: SearchDataType = 'services';
  const quickstartType: SearchDataType = 'quickstarts';

  beforeEach(() => {
    SearchPermissions.clear();
    db = create({ schema: entrySchema });
  });

  it('returns results for a matching term', async () => {
    const id = faker.string.uuid();
    const term = faker.word.noun();
    SearchPermissions.set(id, []);
    await insertEntry(db, {
      id,
      title: `${term} Console`,
      uri: faker.internet.url(),
      pathname: faker.system.filePath(),
      description: faker.lorem.sentence(),
      bundleTitle: faker.commerce.department(),
      type: serviceType,
    });

    const results = await localQuery(db, term, ReleaseEnv.STABLE, serviceType);
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty array for non-matching term', async () => {
    const results = await localQuery(db, faker.string.uuid(), ReleaseEnv.STABLE, serviceType);
    expect(results).toEqual([]);
  });

  it('respects the mode/where filter', async () => {
    const term = faker.word.noun();

    const servicesId = faker.string.uuid();
    const servicesPathname = `/${faker.system.fileName()}`;
    SearchPermissions.set(servicesId, []);
    await insertEntry(db, {
      id: servicesId,
      title: `${term} Services`,
      uri: faker.internet.url(),
      pathname: servicesPathname,
      description: faker.lorem.sentence(),
      bundleTitle: faker.commerce.department(),
      type: serviceType,
    });

    const quickstartId = faker.string.uuid();
    const quickstartPathname = `/${faker.system.fileName()}`;
    SearchPermissions.set(quickstartId, []);
    await insertEntry(db, {
      id: quickstartId,
      title: `${term} Quickstart`,
      uri: faker.internet.url(),
      pathname: quickstartPathname,
      description: faker.lorem.sentence(),
      bundleTitle: faker.commerce.department(),
      type: quickstartType,
    });

    const results = await localQuery(db, term, ReleaseEnv.STABLE, serviceType);
    expect(results.some((r) => r.pathname === servicesPathname)).toBe(true);
    expect(results.every((r) => r.pathname !== quickstartPathname)).toBe(true);
  });

  it('highlights matching text with <mark> tags', async () => {
    const id = faker.string.uuid();
    const term = faker.word.noun();
    SearchPermissions.set(id, []);
    await insertEntry(db, {
      id,
      title: `${term} Automation Platform`,
      uri: faker.internet.url(),
      pathname: faker.system.filePath(),
      description: `Automate with ${term}`,
      bundleTitle: faker.commerce.department(),
      type: serviceType,
    });

    const results = await localQuery(db, term, ReleaseEnv.STABLE, serviceType);
    const hasHighlight = results.some((r) => r.title.includes('<mark>') || r.description.includes('<mark>'));
    expect(hasHighlight).toBe(true);
  });

  it('marks external URLs with isExternal flag', async () => {
    const id = faker.string.uuid();
    const term = 'pipelines';
    SearchPermissions.set(id, []);
    await insertEntry(db, {
      id,
      title: `${term} Documentation`,
      uri: 'https://docs.openshift.com/pipelines/',
      pathname: 'https://docs.openshift.com/pipelines/',
      description: 'OpenShift Pipelines documentation',
      bundleTitle: 'External',
      type: serviceType,
    });

    const results = await localQuery(db, term, ReleaseEnv.STABLE, serviceType);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].isExternal).toBe(true);
  });

  it('does not set isExternal for internal paths', async () => {
    const id = faker.string.uuid();
    const term = 'advisor';
    SearchPermissions.set(id, []);
    await insertEntry(db, {
      id,
      title: `${term} Recommendations`,
      uri: '/insights/advisor',
      pathname: '/insights/advisor',
      description: 'Advisor recommendations',
      bundleTitle: 'Red Hat Insights',
      type: serviceType,
    });

    const results = await localQuery(db, term, ReleaseEnv.STABLE, serviceType);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].isExternal).toBeFalsy();
  });

  it('skips entries with javascript: URL scheme', async () => {
    const id = faker.string.uuid();
    SearchPermissions.set(id, []);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await insertEntry(db, {
      id,
      title: 'Malicious Link',
      uri: 'javascript:alert(1)',
      pathname: 'javascript:alert(1)',
      description: 'Should be skipped',
      bundleTitle: 'External',
      type: serviceType,
    });

    const results = await localQuery(db, 'Malicious', ReleaseEnv.STABLE, serviceType);
    expect(results).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('Skipping non-http(s) search entry', id);
    warnSpy.mockRestore();
  });

  it('skips entries with data: URL scheme', async () => {
    const id = faker.string.uuid();
    SearchPermissions.set(id, []);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await insertEntry(db, {
      id,
      title: 'Data URI Link',
      uri: 'data:text/html,<script>alert(1)</script>',
      pathname: 'data:text/html,<script>alert(1)</script>',
      description: 'Should be skipped',
      bundleTitle: 'External',
      type: serviceType,
    });

    const results = await localQuery(db, 'Data URI', ReleaseEnv.STABLE, serviceType);
    expect(results).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('Skipping non-http(s) search entry', id);
    warnSpy.mockRestore();
  });

  it('allows entries with https: URL scheme', async () => {
    const id = faker.string.uuid();
    SearchPermissions.set(id, []);
    await insertEntry(db, {
      id,
      title: 'Safe External Link',
      uri: 'https://docs.openshift.com/safe',
      pathname: 'https://docs.openshift.com/safe',
      description: 'Should be allowed',
      bundleTitle: 'External',
      type: serviceType,
    });

    const results = await localQuery(db, 'Safe External', ReleaseEnv.STABLE, serviceType);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].isExternal).toBe(true);
  });

  it('limits results to 10', async () => {
    const term = 'orama';
    for (let i = 0; i < 15; i++) {
      const id = faker.string.uuid();
      SearchPermissions.set(id, []);
      await insertEntry(db, {
        id,
        title: `${term} Service ${i}`,
        uri: faker.internet.url(),
        pathname: `/${faker.system.fileName()}-${i}`,
        description: `${term} cloud service number ${i}`,
        bundleTitle: faker.commerce.department(),
        type: serviceType,
      });
    }

    const results = await localQuery(db, term, ReleaseEnv.STABLE, serviceType);
    expect(results.length).toBe(10);
  });
});

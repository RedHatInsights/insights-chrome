import axios from 'axios';
import { searchAPI } from './searchAPI';
import chromeStore from '../state/chromeStore';
import { asyncLocalOrama } from '../state/atoms/localSearchAtom';
import { SearchEntry } from '@redhat-cloud-services/types';

jest.mock('./cacheFetch', () => ({ cacheFetch: jest.fn(async (_key, fetcher) => ({ data: await fetcher(), fromCache: false })) }));
jest.mock('./isNavItemVisible', () => ({ evaluateVisibility: jest.fn(async (entry) => entry) }));

afterEach(() => jest.restoreAllMocks());

it('keeps remote search insertions queryable through the rebuilt index, without allowing malformed entries to poison it', async () => {
  jest.spyOn(axios, 'get').mockResolvedValue({ data: [] });
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const entry: SearchEntry = {
    id: 'remote-doc',
    title: 'Remote API',
    description: 'API reference',
    pathname: '/docs/api',
    uri: '/docs/api',
    bundleTitle: 'Documentation',
    type: 'documentation',
  };
  expect(await searchAPI.query('Remote', 'documentation')).toEqual([]);
  await searchAPI.insert(entry);
  expect((await searchAPI.query('Remote', 'documentation'))[0]).toMatchObject({ id: entry.id, pathname: entry.pathname });
  const index = chromeStore.get(asyncLocalOrama);
  await searchAPI.insert({ id: 'bad', pathname: '/bad', title: 123 } as unknown as SearchEntry);
  expect(warn).toHaveBeenCalledWith('Insert not available:', expect.anything());
  expect(chromeStore.get(asyncLocalOrama)).toBe(index);
  expect((await searchAPI.query('reference', 'documentation'))[0].id).toBe(entry.id);
});

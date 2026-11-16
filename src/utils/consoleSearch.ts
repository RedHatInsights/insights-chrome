import type { Orama } from '@orama/orama';
import { ReleaseEnv, SearchDataType } from '@redhat-cloud-services/types/index.js';
import type { entrySchema } from '../state/atoms/localSearchAtom';
import { hydraQuery, isHydraSearchEnabled } from './hydraSearch';
import { type SearchResultItem, localQuery } from './localSearch';

export type ConsoleSearchSource = 'hydra' | 'local';

export type ConsoleSearchOptions = {
  db: Orama<typeof entrySchema>;
  term: string;
  env?: ReleaseEnv;
  type?: SearchDataType | string;
  signal?: AbortSignal;
};

/**
 * Route a search query to the Hydra backend (behind `platform.chrome.search.hydra`) or the local
 * Orama index. Hydra only holds service entries, so other types always stay local. There is no
 * fallback: Hydra errors (HydraSearchError) and caller aborts reject, so failures stay visible.
 */
export async function consoleSearch({
  db,
  term,
  env = ReleaseEnv.STABLE,
  type = 'services',
  signal,
}: ConsoleSearchOptions): Promise<{ results: SearchResultItem[]; source: ConsoleSearchSource }> {
  if (type === 'services' && isHydraSearchEnabled()) {
    return { results: await hydraQuery(term, { env, signal }), source: 'hydra' };
  }
  return { results: await localQuery(db, term, env, type), source: 'local' };
}

import { atom } from 'jotai';
import { QuickStart } from '@patternfly/quickstarts';
import { ChromeAPI } from '@redhat-cloud-services/types';

/** Runtime extras (`add`, `updateQuickStarts`) exist on the live object but not on public ChromeAPI. */
export type LiveQuickstartsAPI = ChromeAPI['quickStarts'] & {
  add?: (key: string, qs: QuickStart) => boolean;
  updateQuickStarts?: (key: string, quickstarts: QuickStart[]) => void;
};

export const liveQuickstartsAPIRef: { current: LiveQuickstartsAPI | null } = { current: null };
export const liveHelpTopicsAPIRef: { current: ChromeAPI['helpTopics'] | null } = { current: null };

/**
 * Reactive copy of the live `Catalog` so mounted delegate catalogs re-render when
 * the runtime publishes. Wrapped in an object: a bare function passed to
 * `store.set` would be treated as an updater.
 */
export const liveQuickstartsCatalogAtom = atom<{ Catalog: ChromeAPI['quickStarts']['Catalog'] } | null>(null);

export const remoteActiveQuickStartIDAtom = atom<string>('');

import { atom } from 'jotai';
import { ChromeAPI } from '@redhat-cloud-services/types';

/** Runtime extras (`add`, `updateQuickStarts`) exist on the live object but not on public ChromeAPI. */
export type LiveQuickstartsAPI = ChromeAPI['quickStarts'] & {
  add?: (key: string, qs: unknown) => boolean;
  updateQuickStarts?: (key: string, quickstarts: unknown[]) => void;
};

export const liveQuickstartsAPIRef: { current: LiveQuickstartsAPI | null } = { current: null };
export const liveHelpTopicsAPIRef: { current: ChromeAPI['helpTopics'] | null } = { current: null };

export const remoteActiveQuickStartIDAtom = atom<string>('');

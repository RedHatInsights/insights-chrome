import { atom } from 'jotai';
import { ChromeAPI } from '@redhat-cloud-services/types';

export const liveQuickstartsAPIRef: { current: ChromeAPI['quickStarts'] | null } = { current: null };
export const liveHelpTopicsAPIRef: { current: ChromeAPI['helpTopics'] | null } = { current: null };

export const remoteActiveQuickStartIDAtom = atom<string>('');

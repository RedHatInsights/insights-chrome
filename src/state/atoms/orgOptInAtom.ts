import { atom } from 'jotai';

export type OrgOptInStatus = 'idle' | 'loading' | 'resolved' | 'error';

export interface OrgOptInState {
  status: OrgOptInStatus;
  /** `true` if opted in, `false` if not, `null` while unknown (loading/error). */
  v2OptedIn: boolean | null;
  /** Org ID that the current cached value belongs to. */
  identityKey: string | null;
}

export const orgOptInAtom = atom<OrgOptInState>({
  status: 'idle',
  v2OptedIn: null,
  identityKey: null,
});

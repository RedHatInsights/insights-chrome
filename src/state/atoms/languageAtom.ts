import { atom } from 'jotai';
import { ResolvedLanguage } from '../../utils/languageResolution';

/**
 * Resolved language state for the language detection flow (spike branch).
 * Written by useLanguageResolution, read by the LanguageBanner and exposed
 * on the chrome API as `chrome.language`.
 */
export const initialLanguageState: ResolvedLanguage = {
  locale: 'en',
  preference: undefined,
  source: 'default',
  mismatch: false,
  nudgeCandidate: false,
};

export const languageAtom = atom<ResolvedLanguage>(initialLanguageState);

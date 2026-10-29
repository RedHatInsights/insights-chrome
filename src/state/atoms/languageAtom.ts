import { atom } from 'jotai';
import { SupportedLanguage } from '../../utils/languageResolution';

/**
 * The rendering locale. Written by useLanguageResolution from the SSO profile,
 * read by the chrome API as `chrome.language` and by the IntlProvider in
 * bootstrap. This is the entire state: no mismatch flag, no nudge state,
 * no source tracking. The notification reads the profile and navigator
 * directly and does not go through this atom.
 */
export const languageAtom = atom<SupportedLanguage>('en');

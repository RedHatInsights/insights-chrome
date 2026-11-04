import { SupportedLanguage } from '../utils/languageResolution';

/**
 * Lazy loaders for the translated shell catalogs, one entry per delivered
 * locale. The translation pipeline delivers the files as
 * `locales/<locale>.json`; add the matching entry here when it lands:
 *
 * ```ts
 * fr: () => import('../../locales/fr.json'),
 * ```
 *
 * Locales without an entry — all of them today — render the English
 * defaultMessage fallback while formatting follows the locale. Entries are
 * static imports of existing files only, so the map never references a
 * catalog that has not shipped.
 */
export const messageCatalogs: Partial<Record<SupportedLanguage, () => Promise<{ default: Record<string, string> }>>> = {};

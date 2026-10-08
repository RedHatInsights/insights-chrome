// Keep English in the bootstrap chunk so a failed locale request cannot blank the shell.
import englishMessages from './en.json';

type MessageCatalog = Record<string, string>;

type LocaleCatalogModule = {
  default: MessageCatalog;
};

const DEFAULT_LOCALE = 'en';

const importCatalog = (locale: string): Promise<LocaleCatalogModule> =>
  import(
    /* webpackChunkName: "locale-[request]" */
    /* webpackInclude: /\.json$/ */
    /* webpackExclude: /\/en\.json$/ */
    `./${locale}.json`
  ) as Promise<LocaleCatalogModule>;

const normalizeLocale = (locale: string): string => (locale || DEFAULT_LOCALE).replace(/_/g, '-').toLowerCase();

const getLocaleCandidates = (locale: string): string[] => {
  const normalizedLocale = normalizeLocale(locale);
  const baseLocale = normalizedLocale.split('-')[0];

  return [...new Set([normalizedLocale, baseLocale, DEFAULT_LOCALE])];
};

const isMissingCatalog = (error: unknown): boolean => {
  const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error);
  return message.includes('Cannot find module');
};

export const loadMessages = async (requestedLocale: string) => {
  const candidates = getLocaleCandidates(requestedLocale);

  for (const locale of candidates) {
    if (locale === DEFAULT_LOCALE) {
      return { locale, messages: englishMessages };
    }

    try {
      const { default: messages } = await importCatalog(locale);
      return { locale, messages };
    } catch (error) {
      if (!isMissingCatalog(error)) {
        console.error(`Unable to load locale catalog "${locale}", trying fallback.`, error);
      }
    }
  }

  throw new Error('Unable to load the default locale catalog.');
};

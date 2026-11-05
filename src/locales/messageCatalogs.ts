import { SupportedLanguage } from '../utils/languageResolution';

type CatalogModule = { default: Record<string, string> };

// Webpack discovers delivered JSON catalogs without requiring files that have
// not arrived yet. Missing chunks reject and ChromeIntlProvider keeps its fallback.
const importCatalog = (locale: string): Promise<CatalogModule> =>
  import(
    /* webpackChunkName: "locale-[request]" */
    /* webpackInclude: /\.json$/ */
    /* webpackExclude: /\/en\.json$/ */
    `./${locale}.json`
  ) as Promise<CatalogModule>;

// Preserve the SSO locale ids while matching Phrase's repository filenames.
export const messageCatalogs: Partial<Record<SupportedLanguage, () => Promise<CatalogModule>>> = {
  fr: () => importCatalog('fr'),
  ja: () => importCatalog('ja'),
  ko: () => importCatalog('ko'),
  'zh-CN': () => importCatalog('zh-cn'),
};

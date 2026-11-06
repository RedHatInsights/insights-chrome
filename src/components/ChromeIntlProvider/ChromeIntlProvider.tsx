import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { getEnv } from '../../utils/common';
import { languageAtom } from '../../state/atoms/languageAtom';
import { SupportedLanguage } from '../../utils/languageResolution';
import { messageCatalogs } from '../../locales/messageCatalogs';
import englishCatalog from '../../locales/en.json';

/**
 * Wires the resolved console language into the root IntlProvider.
 *
 * The locale comes from languageAtom, written by useLanguageResolution from
 * the SSO profile locale (flag-gated by platform.chrome.language-detection).
 *
 * Catalog loading mirrors the consumer-app pattern: English ships statically
 * (first paint must not wait on a fetch), every other locale loads on demand
 * through the messageCatalogs map — one webpack chunk per delivered locale,
 * so untranslated locales never bloat the shell bundle. While a catalog
 * loads, or when a locale has no catalog yet, messages fall back to the
 * English defaultMessages; date, number and plural formatting follow the
 * locale once its catalog is in.
 */
export const ChromeIntlProvider = ({ children }: React.PropsWithChildren) => {
  const language = useAtomValue(languageAtom);
  const [loadedLocale, setLoadedLocale] = useState<SupportedLanguage>('en');
  const [catalog, setCatalog] = useState<Record<string, string> | null>(englishCatalog);

  useEffect(() => {
    if (language === 'en') {
      setLoadedLocale('en');
      setCatalog(englishCatalog);
      return;
    }

    const loader = messageCatalogs[language];
    if (!loader) {
      setLoadedLocale(language);
      setCatalog(null);
      return;
    }

    let cancelled = false;
    loader()
      .then((module) => {
        if (!cancelled) {
          setLoadedLocale(language);
          setCatalog(module.default);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedLocale(language);
          setCatalog(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <IntlProvider
      locale={loadedLocale}
      messages={catalog ?? undefined}
      defaultLocale="en"
      onError={(error) => {
        if (
          (getEnv() === 'stage' && !window.location.origin.includes('foo')) ||
          localStorage.getItem('chrome:intl:debug') === 'true' ||
          !(error.code === ReactIntlErrorCode.MISSING_TRANSLATION)
        ) {
          console.error(error);
        }
      }}
    >
      {children}
    </IntlProvider>
  );
};

export default ChromeIntlProvider;

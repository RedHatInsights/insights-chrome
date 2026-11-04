import React from 'react';
import { useAtomValue } from 'jotai';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';
import { getEnv } from '../../utils/common';
import { languageAtom } from '../../state/atoms/languageAtom';
import catalogs from '../../locales/data.json';

/**
 * Wires the resolved console language into the root IntlProvider.
 *
 * The locale comes from languageAtom, written by useLanguageResolution from
 * the SSO profile locale (flag-gated by platform.chrome.language-detection).
 * Catalogs for the supported locales arrive through the translation
 * pipeline: until a locale's catalog ships, its messages fall back to the
 * English defaultMessages while date, number and plural formatting already
 * follow the locale.
 */
export const ChromeIntlProvider = ({ children }: React.PropsWithChildren) => {
  const language = useAtomValue(languageAtom);
  const catalog = (catalogs as Record<string, Record<string, string> | undefined>)[language];

  return (
    <IntlProvider
      locale={language}
      messages={catalog}
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

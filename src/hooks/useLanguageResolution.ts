import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { ChromeAuthContextValue } from '../auth/ChromeAuthContext';
import { languageAtom } from '../state/atoms/languageAtom';
import { resolveLocale } from '../utils/languageResolution';

/**
 * Unleash gate for the whole language flow. When off, the atom stays 'en',
 * and chrome.language stays 'en'.
 *
 * The account-console return trip (silent re-auth on ?fromAccount=1 before
 * the app boots) is handled in the auth layer (OIDCProvider), deliberately
 * outside this flag: the parameter only exists if our account-console links
 * created it.
 */
export const LANGUAGE_DETECTION_FLAG = 'platform.chrome.language-detection';

/**
 * Reads the SSO profile locale and publishes the rendering locale to
 * languageAtom. The profile value is used verbatim: if it is one of the
 * supported ids, it becomes the locale; otherwise English. No resolution,
 * no negotiation, no navigator.language fallback for rendering.
 */
export function useLanguageResolution(chromeAuth: ChromeAuthContextValue) {
  const setLanguage = useSetAtom(languageAtom);
  const languageDetectionEnabled = useFlag(LANGUAGE_DETECTION_FLAG);

  useEffect(() => {
    if (!languageDetectionEnabled) {
      setLanguage('en');
      return;
    }

    const profileLocale = chromeAuth.user?.identity?.user?.locale as string | undefined;
    setLanguage(resolveLocale(profileLocale));
  }, [chromeAuth.user?.identity?.user?.locale, languageDetectionEnabled, setLanguage]);
}

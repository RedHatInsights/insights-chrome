import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { ChromeAuthContextValue } from '../auth/ChromeAuthContext';
import { languageAtom } from '../state/atoms/languageAtom';
import { resolveLocale } from '../utils/languageResolution';

/**
 * Unleash gate for the whole language flow. When off, the atom stays 'en',
 * chrome.language stays 'en', and the return-trip refresh stays inert.
 */
export const LANGUAGE_DETECTION_FLAG = 'platform.chrome.language-detection';

/**
 * Marks the return trip from the SSO account console. On arrival we force a
 * silent re-auth so fresh token claims (including the locale) land before
 * the page re-renders, then reboot the console.
 */
export const ACCOUNT_RETURN_PARAM = 'fromAccount';

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

    // Return trip from the account console: refresh the token, then reboot.
    const params = new URLSearchParams(window.location.search);
    if (params.get(ACCOUNT_RETURN_PARAM) === '1') {
      params.delete(ACCOUNT_RETURN_PARAM);
      const cleaned = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      chromeAuth
        .loginSilent()
        .catch(() => undefined)
        .finally(() => {
          window.history.replaceState({}, '', cleaned);
          window.location.reload();
        });
      return;
    }

    const profileLocale = chromeAuth.user?.identity?.user?.locale as string | undefined;
    setLanguage(resolveLocale(profileLocale));
  }, [chromeAuth.user?.identity?.user?.locale, chromeAuth.token, chromeAuth.loginSilent, languageDetectionEnabled, setLanguage]);
}

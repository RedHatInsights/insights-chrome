import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { ChromeAuthContextValue } from '../auth/ChromeAuthContext';
import { initialLanguageState, languageAtom } from '../state/atoms/languageAtom';
import { resolveLanguage } from '../utils/languageResolution';

/**
 * Unleash gate for the whole language detection flow. When off, the atom keeps
 * its default (English, no mismatch, no nudge) so the banner stays hidden,
 * chrome.language stays 'en', and the return-trip refresh stays inert — one
 * gate point, everything downstream safe. Unknown flags default to off.
 */
export const LANGUAGE_DETECTION_FLAG = 'platform.chrome.language-detection';

/**
 * Marks the return trip from the SSO account console. The account console
 * back-link targets a URL carrying this param (referrer_uri is ours to choose);
 * on arrival we force a silent re-auth so fresh token claims (including the
 * locale) land before the page re-renders, then reboot the console.
 */
export const ACCOUNT_RETURN_PARAM = 'fromAccount';

/**
 * Runs the language detection cascade and publishes the result to languageAtom.
 *
 * Re-resolves whenever the SSO profile locale or the token changes (silent
 * renew issues fresh claims), so the banner and chrome.language stay in sync
 * with the actual token contents.
 */
export function useLanguageResolution(chromeAuth: ChromeAuthContextValue) {
  const setLanguage = useSetAtom(languageAtom);
  const languageDetectionEnabled = useFlag(LANGUAGE_DETECTION_FLAG);

  useEffect(() => {
    if (!languageDetectionEnabled) {
      // reset so a mid-session flag toggle-off clears any rendered state
      setLanguage(initialLanguageState);
      return;
    }

    // Return trip from the account console: refresh the token, then reboot so
    // every consumer (including tenant apps mounting fresh) sees the new locale.
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

    // The Customer Portal's rh_locale cookie is not read: language selection
    // is delegated to the SSO profile, the single source of truth.
    const resolved = resolveLanguage({
      profileLocale: chromeAuth.user?.identity?.user?.locale as string | undefined,
      navigatorLanguage: navigator.language,
    });
    setLanguage(resolved);
  }, [chromeAuth.user?.identity?.user?.locale, chromeAuth.token, chromeAuth.loginSilent, languageDetectionEnabled, setLanguage]);
}

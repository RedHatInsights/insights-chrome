/**
 * Locale determination for the HCC language flow.
 *
 * The SSO profile is the single source of truth. The profile value is used
 * verbatim: if a catalog exists for it, that language renders. If not, the
 * i18n library falls back to English. There is no resolution logic, no
 * mapping table, no locale normalization.
 *
 * navigator.language is never used to determine the rendering language.
 * It is used only by the notification component to decide whether to show
 * a notification.
 */

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'ko', 'ja', 'zh-CN'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Returns the rendering locale: the profile locale if it is one of the
 * supported ids, English otherwise. This is the entire public API.
 */
export function resolveLocale(profileLocale: string | undefined): SupportedLanguage {
  if (profileLocale && (SUPPORTED_LANGUAGES as readonly string[]).includes(profileLocale)) {
    return profileLocale as SupportedLanguage;
  }
  return 'en';
}

// ---------------------------------------------------------------------------
// Notification logic — internal to the LanguageNotifier component.
// Never affects rendering; only decides which notification (if any) to show.
// ---------------------------------------------------------------------------

export type NotificationCase = { type: 'none' } | { type: 'unsupported'; profileLanguage: string } | { type: 'discovery'; browserLanguage: string };

/**
 * Returns true when the (base) language has a catalog to render in.
 * Notification-internal: never used for rendering.
 */
function isSupportedBase(base: string): boolean {
  return base === 'zh-Hans' || (SUPPORTED_LANGUAGES as readonly string[]).includes(base);
}

/**
 * Returns the script-aware base language for comparison purposes.
 * zh variants split into zh-Hans (Simplified) and zh-Hant (Traditional);
 * everything else truncates to the primary subtag.
 * Notification-internal: never used for rendering.
 */
function baseLanguage(tag: string): string {
  const lower = tag.toLowerCase().replace(/_/g, '-');
  if (lower.startsWith('zh')) {
    return /tw|hant|hk|mo/.test(lower) ? 'zh-Hant' : 'zh-Hans';
  }
  return lower.split('-')[0];
}

/**
 * Determines the notification case.
 *
 * Keycloak defaults the profile locale to "en_US" when no choice is made,
 * so the profile is never truly absent. The "no locale set" scenario
 * collapses into the English-default cases below.
 *
 * 1. Profile language not supported → fallback notice ("we switched it back
 *    to English"). Takes precedence over everything: the user picked a
 *    language we cannot render, and the console silently fell back.
 * 2. Profile (or default "en_US") and browser agree → no notification
 * 3. Profile and browser disagree, browser language supported → discovery
 *    nudge ("<language> is supported… would you like to switch?")
 * 4. Profile and browser disagree, browser language not supported → no
 *    notification
 */
export function getNotificationCase(profileLocale: string | undefined, navigatorLanguage: string): NotificationCase {
  const profileBase = baseLanguage(profileLocale ?? 'en_US');
  const browserBase = baseLanguage(navigatorLanguage);

  if (!isSupportedBase(profileBase)) {
    return { type: 'unsupported', profileLanguage: profileLocale ?? 'en_US' };
  }

  if (profileBase === browserBase) {
    return { type: 'none' };
  }

  if (isSupportedBase(browserBase)) {
    return { type: 'discovery', browserLanguage: navigatorLanguage };
  }

  return { type: 'none' };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Query parameter marking the return trip from the SSO account console.
 * The account-console links set it, and the OIDC layer (OIDCProvider)
 * consumes it on the landing page load to force a silent re-auth before the
 * app boots, so fresh token claims — including an updated locale — are in
 * place before anything renders.
 */
export const ACCOUNT_RETURN_PARAM = 'fromAccount';

/**
 * Shared debug flag for the language flow: set localStorage
 * "chrome:intl:debug" = "true". Consumed by LanguageNotifier and the
 * OIDCProvider return-trip handling.
 */
export const INTL_DEBUG_KEY = 'chrome:intl:debug';

/**
 * The page to return to after an account-console visit, computed from the
 * user's current location at click time (not at notification render time:
 * the toast persists across SPA navigation, so a boot-time pathname would
 * send the user back to the wrong page). Preserves the current query string
 * and hash so bookmarked deep links survive the round trip.
 */
export function buildCurrentReturnTo(): string {
  const url = new URL(window.location.href);
  url.searchParams.set(ACCOUNT_RETURN_PARAM, '1');
  return url.toString();
}

/**
 * Builds the SSO account console URL with the referrer mechanism:
 * the console shows a "Back to cloud-services" masthead link pointing at returnTo.
 */
export function buildAccountConsoleUrl(ssoUrl: string, returnTo: string): string {
  const base = ssoUrl.replace(/\/+$/, '');
  return `${base}/realms/redhat-external/account/?referrer=cloud-services&referrer_uri=${encodeURIComponent(returnTo)}`;
}

/**
 * Native display name for a language tag. Used by the language notifications
 * so each language is presented in its own script.
 */
export function languageDisplayName(tag: string | undefined): string {
  if (!tag) {
    return '';
  }
  try {
    const display = new Intl.DisplayNames([tag], { type: 'language' });
    return display.of(tag) ?? tag;
  } catch {
    return tag;
  }
}

/**
 * Display name in sentence case for the English message template, where the
 * language name starts the sentence ("Français language is supported…").
 * Native names arrive lowercase in some languages ("français"), which reads
 * wrong sentence-initially. A no-op for scripts without case ("中文").
 */
export function sentenceCaseDisplayName(tag: string | undefined): string {
  const name = languageDisplayName(tag);
  return name.charAt(0).toLocaleUpperCase() + name.slice(1);
}

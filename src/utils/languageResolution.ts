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
// Notification logic — internal to the LanguageBanner component.
// Never affects rendering; only decides which notification (if any) to show.
// ---------------------------------------------------------------------------

export type NotificationCase = { type: 'none' } | { type: 'discovery'; browserLanguage: string } | { type: 'multilingual' };

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
 * collapses into case 1 or 2 depending on the browser language.
 *
 * 1. SSO locale (or default "en_US"), browser agrees → no notification
 * 2. SSO locale (or default "en_US"), browser disagrees, browser supported → discovery nudge
 * 3. SSO locale, browser disagrees, browser language not supported → no notification
 */
export function getNotificationCase(profileLocale: string | undefined, navigatorLanguage: string): NotificationCase {
  const profileBase = baseLanguage(profileLocale ?? 'en_US');
  const browserBase = baseLanguage(navigatorLanguage);

  if (profileBase === browserBase) {
    return { type: 'none' };
  }

  const browserSupported = browserBase === 'zh-Hans' || (SUPPORTED_LANGUAGES as readonly string[]).includes(browserBase);

  if (browserSupported) {
    return { type: 'discovery', browserLanguage: navigatorLanguage };
  }

  return { type: 'none' };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Builds the SSO account console URL with the referrer mechanism:
 * the console shows a "Back to cloud-services" masthead link pointing at returnTo.
 */
export function buildAccountConsoleUrl(ssoUrl: string, returnTo: string): string {
  const base = ssoUrl.replace(/\/+$/, '');
  return `${base}/realms/redhat-external/account/?referrer=cloud-services&referrer_uri=${encodeURIComponent(returnTo)}`;
}

/**
 * Native display name for a language tag. Used by the multilingual notification
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

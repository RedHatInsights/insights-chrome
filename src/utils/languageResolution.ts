/**
 * Language resolution for the HCC language detection flow (spike branch).
 *
 * Detection cascade: SSO profile locale -> navigator.language.
 * (The Customer Portal's `rh_locale` cookie is deliberately not part of the
 * cascade: language selection is delegated to the SSO profile, the single
 * source of truth.)
 * Negotiation: the winning preference is matched against SUPPORTED_LANGUAGES.
 * Regional variants fall back to the base language (fr-CA -> fr). Chinese
 * splits by script (product decision, Oct 2026, per UX): Hans variants
 * (zh, zh-CN, zh-Hans, zh-SG) resolve to the simplified catalog; Hant
 * variants (zh-TW, zh-HK, zh-MO, zh-Hant) are unsupported — English
 * fallback plus the mismatch notification — because zh-Hans is not the
 * official writing system for the Taiwan region, and silently substituting
 * scripts would decide for the user instead of informing them.
 *
 * A preference outside the supported set renders English and flags a mismatch,
 * which drives the pinned notification. An SSO English preference combined
 * with a non-English browser flags a discovery-nudge candidate.
 *
 * Design source: wiki "i18n Locale Preference Spike" (resolution flow v2).
 */

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'ko', 'ja', 'zh-CN'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Base-language lookup for variant stripping.
 * zh maps to the simplified Chinese catalog key (matches the rbac-ui pilot catalogs).
 */
const BASE_LANGUAGE: Record<string, SupportedLanguage> = {
  en: 'en',
  fr: 'fr',
  ko: 'ko',
  ja: 'ja',
  zh: 'zh-CN',
};

export type LanguageSource = 'sso' | 'navigator' | 'default';

export interface ResolvedLanguage {
  /** Locale the console renders. Always a member of SUPPORTED_LANGUAGES. */
  locale: SupportedLanguage;
  /** Raw preference that won the cascade, before negotiation. */
  preference: string | undefined;
  /** Cascade step that produced the preference. */
  source: LanguageSource;
  /**
   * Preference exists but is not renderable: English fallback active,
   * the pinned mismatch notification applies.
   */
  mismatch: boolean;
  /**
   * SSO says English (likely a registration default) while the browser
   * says something else: the one-time discovery nudge applies.
   */
  nudgeCandidate: boolean;
}

export interface LanguageResolutionInput {
  /** locale claim from the SSO profile (identity.user.locale) */
  profileLocale?: string;
  /** navigator.language */
  navigatorLanguage?: string;
}

/**
 * Tolerates legacy tag shapes (zh_CN, zh-hans, en_us) as defensive robustness —
 * the motivating input (the portal cookie) is gone from the cascade, but
 * claim and navigator values can still arrive in unexpected forms.
 * Returns undefined for empty input, otherwise the normalized tag: a
 * supported language, a base language, or the lowercased first subtag for
 * unsupported languages.
 */
export function normalizeLanguageTag(tag: string | undefined): string | undefined {
  if (!tag) {
    return undefined;
  }
  const compact = tag.toLowerCase().replace(/_/g, '-');
  const base = compact.split('-')[0];
  if (base.startsWith('zh')) {
    // Chinese splits by script (product decision, Oct 2026, per UX): Hans variants
    // resolve to the simplified catalog; Hant variants (zh-TW, zh-HK, zh-MO, zh-Hant)
    // are unsupported — English fallback + the mismatch notification. zh-Hans is not
    // the official writing system for the Taiwan region; serving it silently to a
    // traditional reader would substitute scripts without the user's consent.
    const isHant = /(^|-)(tw|hant|hk|mo)(-|$)/.test(compact);
    return isHant ? 'zh-Hant' : 'zh-CN';
  }
  if (compact.startsWith('en')) {
    return 'en';
  }
  return base;
}

function negotiate(tag: string): SupportedLanguage | undefined {
  const normalized = normalizeLanguageTag(tag);
  if (!normalized) {
    return undefined;
  }
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(normalized)) {
    return normalized as SupportedLanguage;
  }
  return BASE_LANGUAGE[normalized];
}

/**
 * Runs the detection cascade and the negotiation.
 * Pure function: all inputs explicit, no DOM access.
 */
export function resolveLanguage({ profileLocale, navigatorLanguage }: LanguageResolutionInput): ResolvedLanguage {
  const steps: Array<{ value: string | undefined; source: LanguageSource }> = [
    { value: profileLocale, source: 'sso' },
    { value: navigatorLanguage, source: 'navigator' },
  ];
  const winner = steps.find((step) => step.value);

  if (!winner?.value) {
    return { locale: 'en', preference: undefined, source: 'default', mismatch: false, nudgeCandidate: false };
  }

  const resolved = negotiate(winner.value);
  const mismatch = resolved === undefined;

  const preferenceIsEnglish = normalizeLanguageTag(winner.value) === 'en';
  const navigatorBase = normalizeLanguageTag(navigatorLanguage);
  const nudgeCandidate = winner.source === 'sso' && preferenceIsEnglish && !!navigatorBase && navigatorBase !== 'en';

  return {
    locale: resolved ?? 'en',
    preference: winner.value,
    source: winner.source,
    mismatch,
    nudgeCandidate,
  };
}

/**
 * Builds the SSO account console URL with the referrer mechanism:
 * the console shows a "Back to cloud-services" masthead link pointing at returnTo.
 * The referrer must be a known client ID; the referrer_uri accepts any
 * console.redhat.com path.
 */
export function buildAccountConsoleUrl(ssoUrl: string, returnTo: string): string {
  const base = ssoUrl.replace(/\/+$/, '');
  return `${base}/realms/redhat-external/account/?referrer=cloud-services&referrer_uri=${encodeURIComponent(returnTo)}`;
}

/**
 * Native display name for a language tag, used by notifications (which are
 * English-only by construction: their audience is by definition users whose
 * language we do not render, so the user's own language must be self-identifying).
 *
 * Uses Intl.DisplayNames with the tag as its own display locale, which yields
 * the native name ("italiano", "한국어") for any tag the browser knows — no
 * hand-maintained map to drift when CIAM adds languages. Falls back to the
 * raw tag for anything the browser cannot resolve.
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

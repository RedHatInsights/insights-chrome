import { buildAccountConsoleUrl, normalizeLanguageTag, resolveLanguage } from './languageResolution';

describe('languageResolution', () => {
  describe('normalizeLanguageTag', () => {
    it('normalizes the wild rh_locale cookie variants', () => {
      expect(normalizeLanguageTag('zh_CN')).toBe('zh-CN');
      expect(normalizeLanguageTag('zh_hans')).toBe('zh-CN');
      expect(normalizeLanguageTag('zh-cn')).toBe('zh-CN');
      expect(normalizeLanguageTag('zh-hans')).toBe('zh-CN');
      expect(normalizeLanguageTag('zhcn')).toBe('zh-CN');
      expect(normalizeLanguageTag('en_us')).toBe('en');
      expect(normalizeLanguageTag('en-GB')).toBe('en');
    });

    it('splits Chinese by script: Hant variants are distinct from Hans', () => {
      expect(normalizeLanguageTag('zh-TW')).toBe('zh-Hant');
      expect(normalizeLanguageTag('zh_tw')).toBe('zh-Hant');
      expect(normalizeLanguageTag('zh-Hant')).toBe('zh-Hant');
      expect(normalizeLanguageTag('zh-HK')).toBe('zh-Hant');
      expect(normalizeLanguageTag('zh-MO')).toBe('zh-Hant');
      expect(normalizeLanguageTag('zh')).toBe('zh-CN');
      expect(normalizeLanguageTag('zh-SG')).toBe('zh-CN');
    });

    it('returns undefined for empty input', () => {
      expect(normalizeLanguageTag(undefined)).toBeUndefined();
      expect(normalizeLanguageTag('')).toBeUndefined();
    });

    it('keeps unsupported bases for mismatch reporting', () => {
      expect(normalizeLanguageTag('it')).toBe('it');
      expect(normalizeLanguageTag('pt-BR')).toBe('pt');
    });
  });

  describe('resolveLanguage - detection cascade', () => {
    it('prefers the SSO profile locale', () => {
      expect(resolveLanguage({ profileLocale: 'fr', cookieLocale: 'ko', navigatorLanguage: 'ja' })).toMatchObject({
        locale: 'fr',
        source: 'sso',
        mismatch: false,
      });
    });

    it('falls back to navigator when the profile is unset', () => {
      expect(resolveLanguage({ navigatorLanguage: 'ja' })).toMatchObject({ locale: 'ja', source: 'navigator' });
    });

    it('defaults to English with no mismatch when nothing is set', () => {
      expect(resolveLanguage({})).toEqual({
        locale: 'en',
        preference: undefined,
        source: 'default',
        mismatch: false,
        nudgeCandidate: false,
      });
    });
  });

  describe('resolveLanguage - negotiation', () => {
    it('strips regional variants to the base language', () => {
      expect(resolveLanguage({ profileLocale: 'fr-CA' })).toMatchObject({ locale: 'fr', mismatch: false });
      expect(resolveLanguage({ profileLocale: 'en-GB' })).toMatchObject({ locale: 'en', mismatch: false });
    });

    it('resolves Hans Chinese variants to the simplified catalog', () => {
      expect(resolveLanguage({ profileLocale: 'zh' })).toMatchObject({ locale: 'zh-CN', mismatch: false });
      expect(resolveLanguage({ navigatorLanguage: 'zh_hans' })).toMatchObject({ locale: 'zh-CN', mismatch: false });
      expect(resolveLanguage({ profileLocale: 'zh-SG' })).toMatchObject({ locale: 'zh-CN', mismatch: false });
    });

    it('treats Hant Chinese variants as unsupported: English fallback, no silent script substitution', () => {
      // product decision (Oct 2026, per UX): zh-Hans is not the official writing
      // system for the Taiwan region — the mismatch notification gives the user
      // an informed choice instead of deciding for them
      expect(resolveLanguage({ profileLocale: 'zh-TW' })).toMatchObject({ locale: 'en', preference: 'zh-TW', mismatch: true });
      expect(resolveLanguage({ profileLocale: 'zh-Hant' })).toMatchObject({ locale: 'en', mismatch: true });
      expect(resolveLanguage({ navigatorLanguage: 'zh-HK' })).toMatchObject({ locale: 'en', mismatch: true });
    });

    it('flags a mismatch for unsupported preferences', () => {
      expect(resolveLanguage({ profileLocale: 'it' })).toMatchObject({
        locale: 'en',
        preference: 'it',
        mismatch: true,
      });
      expect(resolveLanguage({ profileLocale: 'pt-BR' })).toMatchObject({ locale: 'en', mismatch: true });
    });
  });

  describe('resolveLanguage - discovery nudge', () => {
    it('flags English SSO preference with a non-English browser', () => {
      expect(resolveLanguage({ profileLocale: 'en', navigatorLanguage: 'it' })).toMatchObject({
        locale: 'en',
        nudgeCandidate: true,
      });
    });

    it('does not nudge when the browser is English', () => {
      expect(resolveLanguage({ profileLocale: 'en', navigatorLanguage: 'en-US' })).toMatchObject({
        nudgeCandidate: false,
      });
    });

    it('does not nudge when the SSO preference is a supported non-English language', () => {
      expect(resolveLanguage({ profileLocale: 'fr', navigatorLanguage: 'it' })).toMatchObject({
        locale: 'fr',
        nudgeCandidate: false,
      });
    });

    it('does not nudge on a mismatch (the pinned notification covers that user)', () => {
      expect(resolveLanguage({ profileLocale: 'it', navigatorLanguage: 'it' })).toMatchObject({
        mismatch: true,
        nudgeCandidate: false,
      });
    });

    it('does not nudge when the browser locale is unknown', () => {
      expect(resolveLanguage({ profileLocale: 'en' })).toMatchObject({ nudgeCandidate: false });
    });
  });

  describe('buildAccountConsoleUrl', () => {
    it('builds the referrer link with an encoded return URL', () => {
      expect(buildAccountConsoleUrl('https://sso.stage.redhat.com/auth/', 'https://ci.foo.redhat.com/insights/?fromAccount=1')).toBe(
        'https://sso.stage.redhat.com/auth/realms/redhat-external/account/?referrer=cloud-services&referrer_uri=' +
          encodeURIComponent('https://ci.foo.redhat.com/insights/?fromAccount=1')
      );
    });
  });
});

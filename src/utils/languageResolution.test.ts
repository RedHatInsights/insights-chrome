import { buildCurrentReturnTo, getNotificationCase, resolveLocale } from './languageResolution';

describe('resolveLocale', () => {
  it('returns supported profile locales verbatim', () => {
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale('fr')).toBe('fr');
    expect(resolveLocale('ja')).toBe('ja');
    expect(resolveLocale('ko')).toBe('ko');
    expect(resolveLocale('zh-CN')).toBe('zh-CN');
  });

  it('returns English for unsupported profile locales', () => {
    expect(resolveLocale('zh-TW')).toBe('en');
    expect(resolveLocale('de')).toBe('en');
    expect(resolveLocale('it')).toBe('en');
    expect(resolveLocale('pt-BR')).toBe('en');
    expect(resolveLocale('fr-FR')).toBe('en');
  });

  it('treats an empty profile locale as missing', () => {
    expect(getNotificationCase('', 'fr')).toEqual({ type: 'discovery', browserLanguage: 'fr' });
    expect(getNotificationCase('', '')).toEqual({ type: 'none' });
  });

  it('returns English when the profile locale is missing', () => {
    expect(resolveLocale(undefined)).toBe('en');
    expect(resolveLocale('')).toBe('en');
    expect(resolveLocale('en_US')).toBe('en');
  });
});

describe('getNotificationCase', () => {
  describe('case 1: SSO set, browser agrees', () => {
    it('returns none when profile and browser match exactly', () => {
      expect(getNotificationCase('fr', 'fr')).toEqual({ type: 'none' });
      expect(getNotificationCase('zh-CN', 'zh-CN')).toEqual({ type: 'none' });
    });

    it('returns none when profile and browser share the same base language', () => {
      expect(getNotificationCase('fr', 'fr-FR')).toEqual({ type: 'none' });
      expect(getNotificationCase('en', 'en-GB')).toEqual({ type: 'none' });
    });

    it('returns unsupported when both agree on an unsupported language', () => {
      expect(getNotificationCase('zh-TW', 'zh-TW')).toEqual({ type: 'unsupported', profileLanguage: 'zh-TW' });
      expect(getNotificationCase('de', 'de-DE')).toEqual({ type: 'unsupported', profileLanguage: 'de' });
    });
  });

  describe('case 1: profile language not supported (fallback notice)', () => {
    it('fires for regional variants of supported languages, which only render English', () => {
      // resolveLocale('fr-FR') renders 'en' — the user must be told why.
      expect(getNotificationCase('fr-FR', 'fr-FR')).toEqual({ type: 'unsupported', profileLanguage: 'fr-FR' });
      // zh-Hans is not the catalog id (zh-CN is), so it also renders English.
      expect(getNotificationCase('zh-Hans', 'zh-CN')).toEqual({ type: 'unsupported', profileLanguage: 'zh-Hans' });
      expect(getNotificationCase('zh', 'zh')).toEqual({ type: 'unsupported', profileLanguage: 'zh' });
    });

    it('does not fire for English variants, which render the requested language', () => {
      expect(getNotificationCase('en-GB', 'en-US')).toEqual({ type: 'none' });
      expect(getNotificationCase('en_US', 'fr')).toEqual({ type: 'discovery', browserLanguage: 'fr' });
    });

    it('fires exactly when resolveLocale silently renders English', () => {
      const silentlyEnglish = ['fr-FR', 'fr-CA', 'zh-Hans', 'zh', 'zh-TW', 'de', 'pt-BR', 'es-419'];
      const englishVariants = ['en', 'en_US', 'en-GB', '', undefined];
      const supportedNonEnglish = ['fr', 'ko', 'ja', 'zh-CN'];
      silentlyEnglish.forEach((locale) => {
        expect(resolveLocale(locale)).toBe('en');
        expect(getNotificationCase(locale, 'en')).toEqual({ type: 'unsupported', profileLanguage: locale ?? 'en_US' });
      });
      englishVariants.forEach((locale) => {
        expect(getNotificationCase(locale, 'en')).toEqual({ type: 'none' });
      });
      // Their requested language renders, so never the fallback notice; an
      // English browser still earns them the discovery nudge.
      supportedNonEnglish.forEach((locale) => {
        expect(getNotificationCase(locale, 'en')).toEqual({ type: 'discovery', browserLanguage: 'en' });
      });
    });

    it('returns unsupported when the profile language has no catalog, regardless of browser', () => {
      expect(getNotificationCase('de', 'de-DE')).toEqual({ type: 'unsupported', profileLanguage: 'de' });
      expect(getNotificationCase('pt-BR', 'fr')).toEqual({ type: 'unsupported', profileLanguage: 'pt-BR' });
      expect(getNotificationCase('it', 'en')).toEqual({ type: 'unsupported', profileLanguage: 'it' });
    });

    it('takes precedence over the discovery nudge', () => {
      expect(getNotificationCase('de', 'fr')).toEqual({ type: 'unsupported', profileLanguage: 'de' });
      expect(getNotificationCase('zh-TW', 'zh-CN')).toEqual({ type: 'unsupported', profileLanguage: 'zh-TW' });
    });

    it('does not fire for the Keycloak English default', () => {
      expect(getNotificationCase('en_US', 'en')).toEqual({ type: 'none' });
      expect(getNotificationCase('en_US', 'de')).toEqual({ type: 'none' });
      expect(getNotificationCase(undefined, 'de')).toEqual({ type: 'none' });
    });

    it('fires for a Traditional Chinese profile regardless of the browser language', () => {
      expect(getNotificationCase('zh-HK', 'de')).toEqual({ type: 'unsupported', profileLanguage: 'zh-HK' });
    });
  });

  describe('case 2: SSO set, browser disagrees, browser supported', () => {
    it('returns discovery when the browser language is supported', () => {
      expect(getNotificationCase('en', 'fr')).toEqual({ type: 'discovery', browserLanguage: 'fr' });
      expect(getNotificationCase('en', 'ja')).toEqual({ type: 'discovery', browserLanguage: 'ja' });
      expect(getNotificationCase('ja', 'ko')).toEqual({ type: 'discovery', browserLanguage: 'ko' });
    });

    it('returns discovery for regional browser variants of supported languages', () => {
      expect(getNotificationCase('en', 'fr-FR')).toEqual({ type: 'discovery', browserLanguage: 'fr-FR' });
      expect(getNotificationCase('en', 'zh-CN')).toEqual({ type: 'discovery', browserLanguage: 'zh-CN' });
    });

    it('does not fire discovery when the profile is already the browser language', () => {
      expect(getNotificationCase('fr', 'fr')).toEqual({ type: 'none' });
      expect(getNotificationCase('fr', 'fr-FR')).toEqual({ type: 'none' });
    });
  });

  describe('case 3: SSO set, browser disagrees, browser not supported', () => {
    it('returns none when the browser language has no catalog', () => {
      expect(getNotificationCase('fr', 'de')).toEqual({ type: 'none' });
      expect(getNotificationCase('fr', 'it')).toEqual({ type: 'none' });
      expect(getNotificationCase('en', 'pt-BR')).toEqual({ type: 'none' });
    });

    it('returns none when the browser language is Traditional Chinese', () => {
      expect(getNotificationCase('zh-CN', 'zh-TW')).toEqual({ type: 'none' });
      expect(getNotificationCase('zh-CN', 'zh-HK')).toEqual({ type: 'none' });
      expect(getNotificationCase('en', 'zh-TW')).toEqual({ type: 'none' });
    });
  });

  describe('Keycloak default "en_US" (no locale set)', () => {
    it('treats the default as English for agreement checks', () => {
      expect(getNotificationCase('en_US', 'en')).toEqual({ type: 'none' });
      expect(getNotificationCase('en_US', 'en-US')).toEqual({ type: 'none' });
    });

    it('fires discovery for non-English browsers when locale is the default', () => {
      expect(getNotificationCase('en_US', 'fr')).toEqual({ type: 'discovery', browserLanguage: 'fr' });
      expect(getNotificationCase('en_US', 'zh')).toEqual({ type: 'discovery', browserLanguage: 'zh' });
    });

    it('returns none for unsupported browsers when locale is the default', () => {
      expect(getNotificationCase('en_US', 'de')).toEqual({ type: 'none' });
    });
  });

  describe('Chinese script edge cases', () => {
    it('zh-CN profile with zh browser agrees (both Simplified)', () => {
      expect(getNotificationCase('zh-CN', 'zh')).toEqual({ type: 'none' });
    });

    it('zh-CN profile with zh-SG browser agrees (both Simplified)', () => {
      expect(getNotificationCase('zh-CN', 'zh-SG')).toEqual({ type: 'none' });
    });

    it('en profile with zh browser fires discovery (zh maps to Simplified)', () => {
      expect(getNotificationCase('en', 'zh')).toEqual({ type: 'discovery', browserLanguage: 'zh' });
    });

    it('en profile with zh-Hans browser fires discovery', () => {
      expect(getNotificationCase('en', 'zh-Hans')).toEqual({ type: 'discovery', browserLanguage: 'zh-Hans' });
    });

    it('en profile with zh-Hant browser returns none (Traditional not supported)', () => {
      expect(getNotificationCase('en', 'zh-Hant')).toEqual({ type: 'none' });
    });
  });

  describe('buildCurrentReturnTo', () => {
    afterEach(() => {
      window.history.replaceState({}, '', '/');
    });

    it('marks the current location with the return parameter, preserving query and hash', () => {
      window.history.replaceState({}, '', '/deep/page?keep=1#frag');
      expect(buildCurrentReturnTo()).toBe(`${window.location.origin}/deep/page?keep=1&fromAccount=1#frag`);
    });

    it('keeps existing query parameters in order and refreshes a stale return parameter', () => {
      window.history.replaceState({}, '', '/page?keep=2&fromAccount=1');
      expect(buildCurrentReturnTo()).toBe(`${window.location.origin}/page?keep=2&fromAccount=1`);
    });
  });
});

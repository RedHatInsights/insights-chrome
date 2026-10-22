import { getNotificationCase, resolveLocale } from './languageResolution';

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

    it('returns none when both agree on an unsupported language', () => {
      expect(getNotificationCase('zh-TW', 'zh-TW')).toEqual({ type: 'none' });
      expect(getNotificationCase('de', 'de-DE')).toEqual({ type: 'none' });
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
});

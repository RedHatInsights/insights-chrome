import { loadMessages } from './loadMessages';

jest.mock(
  './zh-cn.json',
  () => ({
    __esModule: true,
    default: {
      login: '登录',
    },
  }),
  { virtual: true }
);

jest.mock(
  './fr.json',
  () => {
    throw new Error('Loading chunk locale-fr-json failed.');
  },
  { virtual: true }
);

describe('loadMessages', () => {
  it('loads a normalized locale catalog asynchronously', async () => {
    await expect(loadMessages('zh-CN')).resolves.toEqual({
      locale: 'zh-cn',
      messages: {
        login: '登录',
      },
    });
  });

  it('returns English catalog for the default locale', async () => {
    const result = await loadMessages('en');

    expect(result.locale).toBe('en');
    expect(result.messages.login).toBe('Log in');
  });

  it('falls back to English when no matching locale catalog exists', async () => {
    const result = await loadMessages('es-ES');

    expect(result.locale).toBe('en');
    expect(result.messages.login).toBe('Log in');
  });

  it('falls back to English when a translated catalog chunk fails', async () => {
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const result = await loadMessages('fr-FR');

      expect(result.locale).toBe('en');
      expect(result.messages.login).toBe('Log in');
      expect(logError).toHaveBeenCalledWith('Unable to load locale catalog "fr", trying fallback.', expect.any(Error));
    } finally {
      logError.mockRestore();
    }
  });
});

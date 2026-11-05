import { SUPPORTED_LANGUAGES } from '../utils/languageResolution';
import { messageCatalogs } from './messageCatalogs';

jest.mock('./zh-cn.json', () => ({ __esModule: true, default: { login: '登录' } }), { virtual: true });

describe('messageCatalogs', () => {
  it('provides a loader for every supported locale except English', () => {
    expect(Object.keys(messageCatalogs).sort()).toEqual(SUPPORTED_LANGUAGES.filter((locale) => locale !== 'en').sort());
  });

  it('maps the SSO Chinese locale to the lowercase Phrase filename', async () => {
    expect((await messageCatalogs['zh-CN']!()).default).toEqual({ login: '登录' });
  });
});

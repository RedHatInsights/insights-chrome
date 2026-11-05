import { messageCatalogs } from './messageCatalogs';

jest.mock('./fr.json', () => ({ __esModule: true, default: { login: 'Connexion' } }), { virtual: true });
jest.mock('./zh-cn.json', () => ({ __esModule: true, default: { login: '登录' } }), { virtual: true });

describe('messageCatalogs', () => {
  it('loads a delivered locale without adding a static catalog import', async () => {
    expect((await messageCatalogs.fr!()).default).toEqual({ login: 'Connexion' });
  });

  it('maps the SSO Chinese locale to the lowercase Phrase filename', async () => {
    expect((await messageCatalogs['zh-CN']!()).default).toEqual({ login: '登录' });
  });

  it('rejects a catalog that has not arrived so the provider can fall back', async () => {
    await expect(messageCatalogs.ko!()).rejects.toThrow('Cannot find module');
  });
});

import { createSearchTokenizer } from './searchTokenizer';

describe('createSearchTokenizer', () => {
  const tokenize = (text: string) => createSearchTokenizer().tokenize(text);

  it('keeps Chinese, Japanese and Korean words', () => {
    expect(tokenize('角色')).toEqual(['角色']);
    expect(tokenize('グループ')).toEqual(['グループ']);
    expect(tokenize('사용자 관리')).toEqual(['사용자', '관리']);
  });

  it('lowercases and folds Latin accents', () => {
    expect(tokenize('Rôles Écran')).toEqual(['roles', 'ecran']);
  });

  it('keeps Japanese voiced kana intact', () => {
    expect(tokenize('ガイド')).toEqual(['ガイド']);
  });

  it('indexes French elisions whole and by their parts', () => {
    expect(tokenize('Vue d’ensemble')).toEqual(['vue', 'd’ensemble', 'd', 'ensemble']);
  });

  it('drops punctuation and duplicates', () => {
    expect(tokenize('Roles, roles!')).toEqual(['roles']);
  });

  it('passes non-string values through', () => {
    expect(createSearchTokenizer().tokenize(true as unknown as string)).toEqual([true]);
  });

  it('splits on non-letters when Intl.Segmenter is unavailable', () => {
    const { Segmenter } = Intl;
    // @ts-expect-error simulate an engine without Intl.Segmenter
    delete Intl.Segmenter;
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createSearchTokenizer: fallback } = require('./searchTokenizer');
        expect(fallback().tokenize('Rôles 角色')).toEqual(['roles', '角色']);
      });
    } finally {
      Intl.Segmenter = Segmenter;
    }
  });
});

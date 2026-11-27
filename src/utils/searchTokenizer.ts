import type { Tokenizer } from '@orama/orama';

// Orama's default English tokenizer splits on anything outside [A-Za-z0-9] and
// a few Latin accents, so it drops Chinese, Japanese and Korean text entirely
// and breaks words such as "Rôles" in two. The local search index holds
// translated titles next to the English ones, so it needs a tokenizer that
// keeps every script: Intl.Segmenter finds word boundaries (dictionary based
// for CJK), and Latin accents are folded so "roles" also finds "Rôles".

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'word' }) : undefined;

// Only combining marks from the Latin diacritics block are removed; Japanese
// voicing marks and Hangul jamo recompose under NFC.
const foldAccents = (token: string) => token.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');

function words(text: string): string[] {
  if (segmenter) {
    return Array.from(segmenter.segment(text), ({ segment, isWordLike }) => (isWordLike ? segment : '')).filter(Boolean);
  }
  return text.split(/[^\p{L}\p{N}_'-]+/u).filter(Boolean);
}

export function createSearchTokenizer(): Tokenizer {
  const normalizationCache = new Map<string, string>();
  return {
    language: 'english',
    normalizationCache,
    tokenize(raw) {
      if (typeof raw !== 'string') return [raw];
      // French elisions ("d’ensemble", "l'accès") are one segment; index the
      // parts as well so "ensemble" matches.
      const tokens = words(raw.toLowerCase()).flatMap((word) => [word, ...word.split(/['’]/).filter((part) => part && part !== word)]);
      return Array.from(new Set(tokens.map(foldAccents)));
    },
  };
}

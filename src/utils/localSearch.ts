import { search } from '@orama/orama';
import { fuzzySearch } from './levenshtein-search';

type HighlightCategories = 'title' | 'description';

const matchCache: {
  [key in HighlightCategories]: {
    [termKey: string]: string;
  };
} = {
  title: {},
  description: {},
};

type ResultItem = {
  title: string;
  description: string;
  bundleTitle: string;
  pathname: string;
};

const resultCache: {
  [term: string]: ResultItem[];
} = {};

const START_MARK_LENGTH = 6;
const END_MARK_LENGTH = START_MARK_LENGTH + 1;
const OFFSET_BASE = START_MARK_LENGTH + END_MARK_LENGTH;

function markText(text: string, start: number, end: number, offset: number) {
  const markStart = OFFSET_BASE * offset + start + offset * 2 - 1;
  const markEnd = OFFSET_BASE * offset + end + offset * 2;
  return `${text.substring(0, markStart)}<mark>${text.substring(markStart, markEnd)}</mark>${text.substring(markEnd)}`;
}

function highlightText(term: string, text: string, category: HighlightCategories) {
  const key = `${term}-${text}`;
  // check cache
  if (matchCache[category]?.[key]) {
    return matchCache[category][key];
  }
  let internalText = text;
  // generate fuzzy matches
  const res = fuzzySearch(term, internalText, 2);
  const marks = [...res].sort((a, b) => a.start! - b.start!);
  // merge overlapping marks into smaller sets
  // example: start: 1, end: 5, start: 3, end: 7 => start: 1, end: 7
  const merged = marks.reduce<{ start: number; end: number }[]>((acc, { start, end }) => {
    if (!start || !end) return acc;
    const bounded = acc.findIndex((o) => {
      return (o.start >= start && o.start <= end) || (start >= o.start && start <= o.end);
    });
    if (bounded >= 0) {
      acc[bounded] = { start: Math.min(start, acc[bounded].start), end: Math.max(end, acc[bounded].end) };
    } else {
      acc.push({ start, end });
    }
    return acc;
  }, []);
  // mark text from reduced match set
  merged.forEach(({ start, end }, index) => {
    internalText = markText(internalText, start!, end, index);
  });

  // cache result
  matchCache[category][key] = internalText;
  return internalText;
}

export const localQuery = async (db: any, term: string) => {
  try {
    let results: ResultItem[] | undefined = resultCache[term];
    if (results) {
      return results;
    }

    const r = await search(db, {
      term,
      threshold: 0.5,
      tolerance: 1.5,
      properties: ['title', 'description', 'altTitle'],
      limit: 10,
      boost: {
        title: 10,
        altTitle: 5,
        description: 3,
      },
    });

    results = r.hits.map(({ document: { title, description, bundleTitle, pathname } }) => {
      let matchedTitle = title;
      let matchedDescription = description;
      matchedTitle = highlightText(term, matchedTitle, 'title');
      matchedDescription = highlightText(term, matchedDescription, 'description');

      return {
        title: matchedTitle,
        description: matchedDescription,
        bundleTitle,
        pathname,
      };
    });
    resultCache[term] = results;
    return results;
  } catch (error) {
    console.log(error);
    return [];
  }
};

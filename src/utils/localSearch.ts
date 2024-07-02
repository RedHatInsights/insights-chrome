import { search } from '@orama/orama';
import { fuzzySearch } from './levenshtein-search';
import { SearchPermissions, SearchPermissionsCache } from '../state/atoms/localSearchAtom';
import { evaluateVisibility } from './isNavItemVisible';
import { ReleaseEnv } from '../@types/types.d';

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
  id: string;
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

async function checkResultPermissions(id: string, env: ReleaseEnv = ReleaseEnv.STABLE) {
  const cacheKey = `${env}-${id}`;
  const cacheHit = SearchPermissionsCache.get(cacheKey);
  if (cacheHit) {
    return cacheHit;
  }
  const permissions = SearchPermissions.get(id);
  const result = !!(await evaluateVisibility({ id, permissions }))?.isHidden;
  SearchPermissionsCache.set(cacheKey, result);
  return result;
}

export const localQuery = async (db: any, term: string, env: ReleaseEnv = ReleaseEnv.STABLE) => {
  try {
    const cacheKey = `${env}-${term}`;
    let results: ResultItem[] | undefined = resultCache[cacheKey];
    if (results) {
      return results;
    }

    results = [];
    const r = await search(db, {
      term,
      threshold: 0.5,
      tolerance: 1.5,
      properties: ['title', 'description', 'altTitle'],
      boost: {
        title: 10,
        altTitle: 5,
        description: 3,
      },
    });

    const searches: Promise<ResultItem>[] = [];
    for (const hit of r.hits) {
      if (searches.length === 10) {
        break;
      }
      const {
        document: { id },
      } = hit;
      const res = await checkResultPermissions(id);
      // skip hidden items
      if (!res) {
        searches.push(hit.document);
      }
    }
    const validResults = await Promise.all(searches);
    for (let i = 0; i < Math.min(10, validResults.length); i += 1) {
      const { title, description, bundleTitle, pathname, id } = validResults[i];
      results.push({
        title: highlightText(term, title, 'title'),
        description: highlightText(term, description, 'description'),
        bundleTitle,
        pathname,
        id,
      });
    }

    resultCache[cacheKey] = results;
    return results;
  } catch (error) {
    console.log(error);
    return [];
  }
};

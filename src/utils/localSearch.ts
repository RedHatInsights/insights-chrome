import { Orama, search } from '@orama/orama';
import { ReleaseEnv, ResultItem, SearchDataType } from '@redhat-cloud-services/types/index.js';
import { SearchPermissions, SearchPermissionsCache, entrySchema } from '../state/atoms/localSearchAtom';
import { evaluateVisibility } from './isNavItemVisible';
import { Match as FuzzySearchMatch, fuzzySearch, minimumDistanceMatches } from './levenshtein-search';

type HighlightCategories = 'title' | 'description';

const matchCache: {
  [key in HighlightCategories]: {
    [termKey: string]: string;
  };
} = {
  title: {},
  description: {},
};

const resultCache: {
  [term: string]: ResultItem[];
} = {};

// merge overlapping marks into smaller sets
// example: start: 1, end: 5, start: 3, end: 7 => start: 1, end: 7
function joinMatchPositions(marks: FuzzySearchMatch[]) {
  return marks
    .toSorted((a, b) => a.start! - b.start!)
    .reduce<{ start: number; end: number }[]>((acc, { start, end }) => {
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
}

function applyMarks(text: string, marks: { start: number; end: number }[]) {
  const sortedMarks = marks.toSorted((a, b) => a.start - b.start);

  let out = '';
  let prevEnd = 0;

  for (const mark of sortedMarks) {
    if (mark.end < prevEnd) {
      throw new Error(`Invalid mark overlap: { start: ${mark.start}, end: ${mark.end} } overlaps with mark ending at ${prevEnd}`);
    }

    out += text.substring(prevEnd, mark.start);
    out += `<mark>${text.substring(mark.start, mark.end)}</mark>`;

    prevEnd = mark.end;
  }

  out += text.substring(prevEnd, text.length);

  return out;
}

const LOWERCASE_A = 'a'.charCodeAt(0) as number;
const UPPERCASE_A = 'A'.charCodeAt(0) as number;
const UPPERCASE_Z = 'Z'.charCodeAt(0) as number;

// ASCII lowercase, which preserves length (unlink toLowerCase).
function asciiLowercase(value: string) {
  const out = [];

  for (let i = 0; i < value.length; ++i) {
    const codeUnit = value.charCodeAt(i) as number;
    const adjusted = codeUnit >= UPPERCASE_A && codeUnit <= UPPERCASE_Z ? codeUnit - UPPERCASE_A + LOWERCASE_A : codeUnit;

    out.push(adjusted);
  }

  return String.fromCharCode(...out);
}

function highlightText(term: string, text: string, category: HighlightCategories) {
  const key = `${term}-${text}`;

  // check cache
  if (matchCache[category]?.[key]) {
    return matchCache[category][key];
  }

  const mergedMarks = joinMatchPositions(minimumDistanceMatches([...fuzzySearch(asciiLowercase(term), asciiLowercase(text), 2)]));
  const markedText = applyMarks(text, mergedMarks);

  // cache result
  matchCache[category][key] = markedText;
  return markedText;
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

export const localQuery = async (
  db: Orama<typeof entrySchema>,
  term: string,
  env: ReleaseEnv = ReleaseEnv.STABLE,
  mode: SearchDataType | string = 'services'
) => {
  try {
    const cacheKey = `${env}-${term}-${mode}`;
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
      where: {
        type: mode,
      },
      boost: {
        title: 10,
        altTitle: 5,
        description: 3,
      },
    });

    const searches: ResultItem[] = [];
    for (const hit of r.hits) {
      if (searches.length === 10) {
        break;
      }
      const {
        document: { id },
      } = hit;
      const res = await checkResultPermissions(String(id), ReleaseEnv.STABLE);
      // skip hidden items
      if (!res) {
        searches.push({
          ...hit.document,
          id: String(hit.document.id),
        });
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

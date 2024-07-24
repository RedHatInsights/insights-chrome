// heavily inspired by https://github.com/taleinat/levenshtein-search
// package is not maintained anymore, the code lives here
// algorithm is based on https://en.wikipedia.org/wiki/Levenshtein_distance

function* searchExact(needle: string, haystack: string, startIndex = 0, endIndex: number | null = null) {
  const needleLen = needle.length;
  if (needleLen === 0) return;

  if (endIndex === null) {
    endIndex = haystack.length;
  }
  let index;

  while ((index = haystack.indexOf(needle, startIndex)) > -1) {
    if (index + needle.length > endIndex) break;
    yield index;
    startIndex = index + 1;
  }
}

function reverse(string: string) {
  return string.split('').reverse().join('');
}

function makeChar2needleIdx(needle: string, maxDist: number) {
  const res: Record<string, number> = {};
  for (let i = Math.min(needle.length - 1, maxDist); i >= 0; i--) {
    res[needle[i]] = i;
  }
  return res;
}

const debugFlag = false;

export type Match = {
  start: number;
  end: number;
  dist: number;
};

export function* fuzzySearch(needle: string, haystack: string, maxDist: number) {
  if (needle.length > haystack.length + maxDist) return;

  const ngramLen = Math.floor(needle.length / (maxDist + 1));

  if (maxDist === 0) {
    for (const index of searchExact(needle, haystack)) {
      yield {
        start: index,
        end: index + needle.length,
        dist: 0,
      };
    }
  } else if (ngramLen >= 10) {
    yield* fuzzySearchNgrams(needle, haystack, maxDist);
  } else {
    const generator = fuzzySearchCandidates(needle, haystack, maxDist);

    if (debugFlag) {
      for (const match of generator) {
        console.log('search match', match);
        yield match;
      }
    } else {
      yield* generator;
    }
  }
}

export function minimumDistanceMatches(matches: Match[]): Match[] {
  let minDist: number | null = null;
  let out: Match[] = [];

  for (const match of matches) {
    if (minDist === null || match.dist < minDist) {
      minDist = match.dist;
      out = [match];
    } else if (match.dist === minDist) {
      out.push(match);
    }
  }

  return out;
}

function _expand(needle: string, haystack: string, maxDist: number) {
  maxDist = +maxDist;

  let firstDiff;
  for (firstDiff = 0; firstDiff < Math.min(needle.length, haystack.length); firstDiff++) {
    if (needle.charCodeAt(firstDiff) !== haystack.charCodeAt(firstDiff)) break;
  }
  if (firstDiff) {
    needle = needle.slice(firstDiff);
    haystack = haystack.slice(firstDiff);
  }

  if (!needle) {
    return [0, firstDiff];
  } else if (!haystack) {
    if (needle.length <= maxDist) {
      return [needle.length, firstDiff];
    } else {
      return [null, null];
    }
  }

  if (maxDist === 0) return [null, null];

  let scores = new Array(needle.length + 1);
  for (let i = 0; i <= maxDist; i++) {
    scores[i] = i;
  }
  let newScores = new Array(needle.length + 1);

  let minScore = null;
  let minScoreIdx = null;
  let maxGoodScore = maxDist;
  let firstGoodScoreIdx: number | null = 0;
  let lastGoodScoreIdx = needle.length - 1;

  for (let haystackIdx = 0; haystackIdx < haystack.length; haystackIdx++) {
    const char = haystack.charCodeAt(haystackIdx);

    const needleIdxStart = Math.max(0, firstGoodScoreIdx - 1);
    const needleIdxLimit = Math.min(haystackIdx + maxDist, needle.length - 1, lastGoodScoreIdx);

    newScores[0] = scores[0] + 1;
    firstGoodScoreIdx = newScores[0] <= maxGoodScore ? 0 : null;
    lastGoodScoreIdx = newScores[0] <= maxGoodScore ? 0 : -1;

    let needleIdx;
    for (needleIdx = needleIdxStart; needleIdx < needleIdxLimit; needleIdx++) {
      const score = (newScores[needleIdx + 1] = Math.min(
        scores[needleIdx] + +(char !== needle.charCodeAt(needleIdx)),
        scores[needleIdx + 1] + 1,
        newScores[needleIdx] + 1
      ));
      if (score <= maxGoodScore) {
        if (firstGoodScoreIdx === null) firstGoodScoreIdx = needleIdx + 1;
        lastGoodScoreIdx = Math.max(lastGoodScoreIdx, needleIdx + 1 + (maxGoodScore - score));
      }
    }

    const lastScore = (newScores[needleIdx + 1] = Math.min(scores[needleIdx] + +(char !== needle.charCodeAt(needleIdx)), newScores[needleIdx] + 1));
    if (lastScore <= maxGoodScore) {
      if (firstGoodScoreIdx === null) firstGoodScoreIdx = needleIdx + 1;
      lastGoodScoreIdx = needleIdx + 1;
    }

    if (needleIdx === needle.length - 1 && (minScore === null || lastScore <= minScore)) {
      minScore = lastScore;
      minScoreIdx = haystackIdx;
      if (minScore < maxGoodScore) maxGoodScore = minScore;
    }

    [scores, newScores] = [newScores, scores];

    if (firstGoodScoreIdx === null) break;
  }

  if (minScore !== null && minScore <= maxDist) {
    return [minScore, (minScoreIdx ?? 0) + 1 + firstDiff];
  } else {
    return [null, null];
  }
}

function* fuzzySearchNgrams(needle: string, haystack: string, maxDist: number) {
  // use n-gram search
  const ngramLen = Math.floor(needle.length / (maxDist + 1));
  const needleLen = needle.length;
  const haystackLen = haystack.length;
  for (let ngramStartIdx = 0; ngramStartIdx <= needle.length - ngramLen; ngramStartIdx += ngramLen) {
    const ngram = needle.slice(ngramStartIdx, ngramStartIdx + ngramLen);

    const ngramEnd = ngramStartIdx + ngramLen;
    const needleBeforeReversed = reverse(needle.slice(0, ngramStartIdx));
    const needleAfter = needle.slice(ngramEnd);
    const startIdx = Math.max(0, ngramStartIdx - maxDist);
    const endIdx = Math.min(haystackLen, haystackLen - needleLen + ngramEnd + maxDist);

    for (const haystackMatchIdx of searchExact(ngram, haystack, startIdx, endIdx)) {
      // try to expand left
      const [distRight, rightExpandSize] = _expand(
        needleAfter,
        haystack.slice(haystackMatchIdx + ngramLen, haystackMatchIdx - ngramStartIdx + needleLen + maxDist),
        maxDist
      );
      if (distRight === null) continue;

      const [distLeft, leftExpandSize] = _expand(
        needleBeforeReversed,
        reverse(haystack.slice(Math.max(0, haystackMatchIdx - ngramStartIdx - (maxDist - distRight)), haystackMatchIdx)),
        maxDist - distRight
      );
      if (distLeft === null) continue;

      yield {
        start: haystackMatchIdx - (leftExpandSize ?? 0),
        end: haystackMatchIdx + ngramLen + (rightExpandSize ?? 0),
        dist: distLeft + distRight,
      };
    }
  }
}

type BoundedMetadata = {
  startIdx: number;
  needleIdx: number;
  dist: number;
};

function* fuzzySearchCandidates(needle: string, haystack: string, maxDist: number) {
  if (debugFlag) console.log(`fuzzySearchCandidates(${needle}, ${haystack}, ${maxDist})`);

  // prepare some often used things in advance
  const needleLen = needle.length;
  const haystackLen = haystack.length;
  if (needleLen > haystackLen + maxDist) return;
  const char2needleIdx = makeChar2needleIdx(needle, maxDist);

  let prevCandidates: BoundedMetadata[] = []; // candidates from the last iteration
  let candidates: BoundedMetadata[] = []; // new candidates from the current iteration

  // iterate over the chars in the haystack, updating the candidates for each
  for (let i = 0; i < haystack.length; i++) {
    const haystackChar = haystack[i];

    prevCandidates = candidates;
    candidates = [];

    const needleIdx = char2needleIdx[haystackChar];
    if (needleIdx !== undefined) {
      if (needleIdx + 1 === needleLen) {
        yield {
          start: i,
          end: i + 1,
          dist: needleIdx,
        };
      } else {
        candidates.push({
          startIdx: i,
          needleIdx: needleIdx + 1,
          dist: needleIdx,
        });
      }
    }

    for (const candidate of prevCandidates) {
      // if this sequence char is the candidate's next expected char
      if (candidate.needleIdx && needle[candidate.needleIdx] === haystackChar) {
        // if reached the end of the needle, return a match
        if (candidate.needleIdx + 1 === needleLen) {
          yield {
            start: candidate.startIdx,
            end: i + 1,
            dist: candidate.dist,
          };
        } else {
          // otherwise, update the candidate's needleIdx and keep it
          candidates.push({
            startIdx: candidate.startIdx,
            needleIdx: candidate.needleIdx + 1,
            dist: candidate.dist,
          });
        }
      } else {
        if (candidate.dist === maxDist) continue;

        candidates.push({
          startIdx: candidate.startIdx,
          needleIdx: candidate.needleIdx,
          dist: (candidate.dist ?? 0) + 1,
        });

        for (let nSkipped = 1; nSkipped <= maxDist - (candidate.dist ?? 0); nSkipped++) {
          if ((candidate.needleIdx ?? 0) + nSkipped === needleLen) {
            yield {
              start: candidate.startIdx,
              end: i + 1,
              dist: (candidate.dist ?? 0) + nSkipped,
            };
            break;
          } else if (candidate.needleIdx && needle[candidate.needleIdx + nSkipped] === haystackChar) {
            if (candidate.needleIdx + nSkipped + 1 === needleLen) {
              yield {
                start: candidate.startIdx,
                end: i + 1,
                dist: (candidate.dist ?? 0) + nSkipped,
              };
            } else {
              candidates.push({
                startIdx: candidate.startIdx,
                needleIdx: candidate.needleIdx + 1 + nSkipped,
                dist: (candidate.dist ?? 0) + nSkipped,
              });
            }
            break;
          }
        }

        if (i + 1 < haystackLen && (candidate.needleIdx ?? 0) + 1 < needleLen) {
          candidates.push({
            startIdx: candidate.startIdx,
            needleIdx: (candidate.needleIdx ?? 0) + 1,
            dist: (candidate.dist ?? 0) + 1,
          });
        }
      }
    }

    if (debugFlag) console.log('Candidates: ', candidates);
  }

  for (const candidate of candidates) {
    if (!candidate.dist) {
      candidate.dist = 0;
    }
    candidate.dist += needle.length - (candidate.needleIdx ?? 0);
    if (candidate.dist <= maxDist) {
      yield {
        start: candidate.startIdx,
        end: haystack.length,
        dist: candidate.dist,
      };
    }
  }
}

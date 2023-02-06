// legth of </mark> string
const MARK_SIZE = 6;
// number of characters of full mark tag <mark></mark>
const MARK_OFFSET = 13;

const MARK_START = '<mark>';
const MARK_END = '</mark>';

// merge multiple highlight marks into single string
const parseHighlights = (base: string, highlights: string[] = []) => {
  let result = base;
  let markIndexes: [number, number][] = [];
  // find all highlight indexes
  highlights.forEach((highlight) => {
    const markStart = highlight.match(/<mark>/);
    const markEnd = highlight.match(/<\/mark>/);
    if (typeof markStart?.index === 'number' && typeof markEnd?.index === 'number') {
      markIndexes.push([markStart.index, markEnd.index]);
    }
  });

  markIndexes = markIndexes
    // sort marks
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    // update mark positions based mark count
    .map((marks, index) => [marks[0] + index * MARK_OFFSET, marks[1] + index * MARK_OFFSET]);

  // highlight marks in string
  markIndexes.forEach(([start, end]) => {
    result = `${result.slice(0, start)}${MARK_START}${result.slice(start, end - MARK_SIZE)}${MARK_END}${result.slice(end - MARK_SIZE)}`;
  });
  // replace mark with span tags
  return result.replaceAll('<mark>', '<span>').replaceAll('</mark>', '</span>');
};

export default parseHighlights;

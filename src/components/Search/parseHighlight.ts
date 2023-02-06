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

  const highlightStartIndexes = highlights.map((item) => base.match(item.replace('<mark>', '').replace('</mark>', ''))?.index);

  markIndexes = markIndexes
    // update mark positions based mark count
    .map((marks, index) => [marks[0] + index * MARK_OFFSET, marks[1] + index * MARK_OFFSET]);

  // highlight marks in string
  markIndexes.forEach(([start, end], index) => {
    // adjust for highlight starting index
    const startIndex = start + highlightStartIndexes[index]!;
    const endIndex = end + highlightStartIndexes[index]!;

    result = `${result.slice(0, startIndex)}${MARK_START}${result.slice(startIndex, endIndex - MARK_SIZE)}${MARK_END}${result.slice(
      endIndex - MARK_SIZE
    )}`;
  });
  // replace mark with span tags
  return result.replaceAll('<mark>', '<span>').replaceAll('</mark>', '</span>');
};

export default parseHighlights;

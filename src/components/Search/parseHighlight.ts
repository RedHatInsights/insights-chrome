// merge multiple highlight marks into single string
const parseHighlights = (base: string, highlights: string[] = []) => (highlights.length === 0 ? base : highlights.join(' '));

export default parseHighlights;

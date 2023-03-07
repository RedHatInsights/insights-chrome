import React from 'react';
import parseHighlights from './parseHighlight';

import './SearchTitle.scss';

const SearchTitle = ({ title, highlight }: { title: string; highlight?: string[] }) => {
  const parsedDescription = parseHighlights(title, highlight);
  return <p className="chr-c-search__title" dangerouslySetInnerHTML={{ __html: parsedDescription }}></p>;
};

export default SearchTitle;

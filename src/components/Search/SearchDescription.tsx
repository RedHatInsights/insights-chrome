import React from 'react';
import parseHighlights from './parseHighlight';

import './SearchDescription.scss';

const SearchDescription = ({
  description,
  bundleTitle,
  highlight = [],
}: {
  highlight?: string[];
  bundle: string;
  description: string;
  bundleTitle: string;
}) => {
  const parsedDescription = parseHighlights(description, highlight);
  return (
    <div className="chr-c-search__item__description" style={{ display: 'flex', flexDirection: 'column' }}>
      <p dangerouslySetInnerHTML={{ __html: parsedDescription }}></p>
      <span className="bundle">{bundleTitle}</span>
    </div>
  );
};

export default SearchDescription;

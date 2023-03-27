import classNames from 'classnames';
import React from 'react';
import parseHighlights from './parseHighlight';

import './SearchDescription.scss';

const SearchDescription = ({
  description,
  bundleTitle,
  highlight = [],
  bundleHighlight = [],
}: {
  highlight?: string[];
  bundleHighlight?: string[];
  bundle: string;
  description: string;
  bundleTitle: string;
}) => {
  const parsedDescription = parseHighlights(description, highlight);
  return (
    <div className="chr-c-search__item__description" style={{ display: 'flex', flexDirection: 'column' }}>
      <p dangerouslySetInnerHTML={{ __html: parsedDescription }}></p>
      <span
        className={classNames({
          // highlight bundle ig bundle_title or bundle was highlighted
          hl: bundleHighlight.length > 0,
        })}
      >
        {bundleTitle}
      </span>
    </div>
  );
};

export default SearchDescription;

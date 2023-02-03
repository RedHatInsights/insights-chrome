import React from 'react';

import './SearchDescription.scss';

const SearchDescription = ({ description, bundleTitle }: { bundle: string; description: string; bundleTitle: string }) => {
  return (
    <div className="chr-c-search__item__description" style={{ display: 'flex', flexDirection: 'column' }}>
      <span className="abstract">{description}</span>
      <span className="bundle">{bundleTitle}</span>
    </div>
  );
};

export default SearchDescription;

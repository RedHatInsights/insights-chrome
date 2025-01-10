import React from 'react';
import './SearchTitle.scss';

const SearchTitle = ({ title, bundleTitle, className = '' }: { title: string; bundleTitle: string; className?: string }) => {
  const showBundleTitle = bundleTitle.replace(/\s/g, '').length > 0;
  return (
    <div className={`chr-search-title-content pf-v6-u-link-color ${className}`}>
      <small className="pf-v6-u-link-color chr-c-search-title">
        <span className="chr-c-search-title" dangerouslySetInnerHTML={{ __html: title }} />

        {showBundleTitle && (
          <>
            <span className="pf-v6-u-px-sm">|</span>
            <span dangerouslySetInnerHTML={{ __html: bundleTitle }} />
          </>
        )}
      </small>
    </div>
  );
};

export default SearchTitle;

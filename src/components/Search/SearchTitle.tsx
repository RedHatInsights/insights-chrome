import React from 'react';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import './SearchTitle.scss';

const SearchTitle = ({
  title,
  bundleTitle,
  className = '',
  isExternal = false,
}: {
  title: string;
  bundleTitle: string;
  className?: string;
  isExternal?: boolean;
}) => {
  const showBundleTitle = bundleTitle.replace(/\s/g, '').length > 0;
  return (
    <div className={`chr-search-title-content ${className}`}>
      <small className="chr-c-search-title pf-v6-u-display-inline-block">
        {isExternal && (
          <Icon className="pf-v6-u-mr-sm chr-c-icon-external-link" isInline>
            <ExternalLinkAltIcon />
          </Icon>
        )}
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

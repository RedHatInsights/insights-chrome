import React from 'react';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';

const SearchTitle = ({ title, bundleTitle }: { title: string; bundleTitle: string }) => {
  const showBundleTitle = bundleTitle.replace(/\s/g, '').length > 0;
  return (
    <TextContent>
      <Text component="small" className="pf-v5-u-link-color" dangerouslySetInnerHTML={{ __html: title }}></Text>
      {showBundleTitle && (
        <Text component="small" className="pf-v5-u-link-color">
          <span className="pf-v5-u-px-sm">|</span>
        </Text>
      )}
      {showBundleTitle && <Text component="small" className="pf-v5-u-link-color" dangerouslySetInnerHTML={{ __html: bundleTitle }}></Text>}
    </TextContent>
  );
};

export default SearchTitle;

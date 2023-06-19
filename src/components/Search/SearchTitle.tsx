import React from 'react';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';

const SearchTitle = ({ title, bundleTitle }: { title: string; bundleTitle: string }) => {
  return (
    <TextContent>
      <Text component="small" className="pf-v5-u-link-color">
        {title}
        <span className="pf-v5-u-px-sm">|</span>
        {bundleTitle}
      </Text>
    </TextContent>
  );
};

export default SearchTitle;

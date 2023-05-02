import React from 'react';
import { Text, TextContent } from '@patternfly/react-core';

const SearchTitle = ({ title, bundleTitle }: { title: string; bundleTitle: string }) => {
  return (
    <TextContent>
      <Text component="small" className="pf-u-link-color">
        {title}
        <span className="pf-u-px-sm">|</span>
        {bundleTitle}
      </Text>
    </TextContent>
  );
};

export default SearchTitle;

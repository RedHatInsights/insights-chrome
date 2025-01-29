import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import SearchIcon from '@patternfly/react-icons/dist/dynamic/icons/search-icon';

import './EmptySearchState.scss';

const EmptySearchState = () => {
  return (
    <EmptyState className="chr-c-search__empty-state pf-v5-u-pt-md">
      <EmptyStateHeader titleText="No results found" className="pf-v5-u-mb-sm" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>
        <TextContent>
          <Text component="p" className="pf-v5-u-color-200 pf-v5-u-mb-0">
            No results match your criteria.
          </Text>
          <Text component="p" className="pf-v5-u-color-200">
            Try searching Hybrid Cloud help or start a conversation with our Virtual Assistant.
          </Text>
        </TextContent>
      </EmptyStateBody>
    </EmptyState>
  );
};

export default EmptySearchState;

import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateIcon, Text, TextContent, Title } from '@patternfly/react-core';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

const EmptySearchState = () => {
  return (
    <EmptyState className="chr-c-search__empty-state" variant="xs">
      <EmptyStateIcon className="pf-u-mb-xl" icon={SearchIcon} />
      <Title headingLevel="h2" size="lg">
        No results found
      </Title>
      <EmptyStateBody>
        <TextContent>
          <Text>No results match your criteria. Clear the search field and try again.</Text>
        </TextContent>
      </EmptyStateBody>
    </EmptyState>
  );
};

export default EmptySearchState;

import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';

import SearchIcon from '@patternfly/react-icons/dist/dynamic/icons/search-icon';

const EmptySearchState = () => {
  return (
    <EmptyState className="chr-c-search__empty-state" variant="xs">
      <EmptyStateIcon className="pf-v6-u-mb-xl" icon={SearchIcon} />
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

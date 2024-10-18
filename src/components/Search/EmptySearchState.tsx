import React from 'react';
import { EmptyState, EmptyStateBody,  } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Content,  } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';

import SearchIcon from '@patternfly/react-icons/dist/dynamic/icons/search-icon';

const EmptySearchState = () => {
  return (
    <EmptyState titleText={<Title headingLevel="h2" size="lg">
        No results found
      </Title>} icon={SearchIcon} className="chr-c-search__empty-state" variant="xs">
      <EmptyStateBody>
        <Content>
          <Content component="p">No results match your criteria. Clear the search field and try again.</Content>
        </Content>
      </EmptyStateBody>
    </EmptyState>
  );
};

export default EmptySearchState;

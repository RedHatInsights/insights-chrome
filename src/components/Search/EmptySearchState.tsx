import React from 'react';

import useVirtualAssistant from '../../hooks/useVirtualAssistant';

import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import SearchIcon from '@patternfly/react-icons/dist/dynamic/icons/search-icon';

import './EmptySearchState.scss';
import { useFlag } from '@unleash/proxy-client-react';

const EmptySearchState = () => {
  const { openVA } = useVirtualAssistant();
  const isOpenConfig = useFlag('platform.virtual-assistant.is-open-config');

  return (
    <EmptyState
      titleText={
        <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-sm">
          No results found
        </Title>
      }
      icon={SearchIcon}
      className="chr-c-search__empty-state pf-v6-u-pt-md"
      variant="xs"
    >
      <EmptyStateBody>
        <Content>
          <Content component="p" className="pf-v6-u-text-color-subtle pf-v6-u-mb-0">
            No results match your criteria.
          </Content>
          {isOpenConfig ? (
            <Content component="p" className="pf-v6-u-text-color-subtle">
              Try searching Hybrid Cloud help or start a conversation with our{' '}
              <a
                role="button"
                onClick={() => {
                  openVA('');
                }}
              >
                Virtual Assistant.
              </a>
            </Content>
          ) : (
            <Content component="p" className="pf-v6-u-text-color-subtle">
              Try searching Hybrid Cloud help or start a conversation with our Virtual Assistant.
            </Content>
          )}
        </Content>
      </EmptyStateBody>
    </EmptyState>
  );
};

export default EmptySearchState;

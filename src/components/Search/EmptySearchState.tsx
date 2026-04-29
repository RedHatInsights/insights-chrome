import React, { Dispatch, SetStateAction } from 'react';

import { useLoadModule, useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';

import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import SearchIcon from '@patternfly/react-icons/dist/dynamic/icons/search-icon';

import './EmptySearchState.scss';

export type ModelsType = {
  VA: string;
};

type VirtualAssistantState = {
  isOpen: boolean;
  currentModel?: string;
  message?: string;
};

const EmptySearchVALink = () => {
  const { hookResult: useVirtualAssistant, loading } = useRemoteHook<[VirtualAssistantState, Dispatch<SetStateAction<VirtualAssistantState>>]>({
    scope: 'virtualAssistant',
    module: './state/globalState',
    importName: 'useVirtualAssistant',
  });
  const [module] = useLoadModule(
    {
      scope: 'virtualAssistant',
      module: './state/globalState',
      importName: 'Models',
    },
    {}
  );

  const Models = module as ModelsType;
  const [, setState] = useVirtualAssistant || [null, null];

  return (
    <Content component="p" className="pf-v6-u-text-color-subtle">
      Try searching Hybrid Cloud help or start a conversation with our{' '}
      <button
        type="button"
        onClick={() => {
          if (setState) {
            setState({
              isOpen: true,
              currentModel: Models.VA,
              message: '',
            });
          }
        }}
        disabled={loading || !setState}
        className="pf-v6-c-button pf-m-link pf-m-inline"
      >
        Virtual Assistant.
      </button>
    </Content>
  );
};

const EmptySearchState = () => {
  const isVAEnabled = useFlag('platform.va.environment.enabled');

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
          {isVAEnabled ? (
            <EmptySearchVALink />
          ) : (
            <Content component="p" className="pf-v6-u-text-color-subtle">
              Try searching Hybrid Cloud help for more information.
            </Content>
          )}
        </Content>
      </EmptyStateBody>
    </EmptyState>
  );
};

export default EmptySearchState;

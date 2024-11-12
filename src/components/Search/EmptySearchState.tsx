import React from 'react';
import { EmptyState, EmptyStateActions, EmptyStateBody,  EmptyStateFooter, EmptyStateHeader, EmptyStateIcon,EmptyStateVariant } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';

import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/outlined-question-circle-icon';
import SearchIcon from '@patternfly/react-icons/dist/dynamic/icons/search-icon';

import ChatbotIcon from './icon-chatbot-static';
import './EmptySearchState.scss';

const EmptySearchState = () => {
  return (
    <EmptyState className="chr-c-search__empty-state pf-v5-u-pt-md">
      <EmptyStateHeader
        titleText="No results found"
        className="pf-v5-u-mb-sm"
        icon={<EmptyStateIcon icon={SearchIcon} />}
      />
      <EmptyStateBody>
        <TextContent>
          <Text component="p" className="pf-v5-u-color-200 pf-v5-u-mb-0">No results match your criteria.</Text>
          <Text component="p" className="pf-v5-u-color-200">Try searching Hybrid Cloud help or start a conversation with our Virtual Assistant.</Text>
        </TextContent>
      </EmptyStateBody>
      <EmptyStateFooter className="pf-v5-u-mt-md">
        <EmptyStateActions>
{/*          <Button variant="link" className="pf-v5-u-pr-2xl">
            <Icon size="md" className="pf-v5-u-pr-md" isInline> 
              <OutlinedQuestionCircleIcon />
            </Icon>
            Open Hybrid Cloud Console help 
          </Button>*/}
          <Button variant="link">
            <Icon size="md" className="pf-v5-u-pr-md" isInline>    
              <ChatbotIcon className="test" />
            </Icon>
            Launch Virtual Assistant
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default EmptySearchState;

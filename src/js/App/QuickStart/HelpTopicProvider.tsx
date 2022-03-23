import React from 'react';
import { HelpTopic, HelpTopicContainer, HelpTopicContainerProps } from '@patternfly/quickstarts';

interface HelpTopicProviderProps {
  helpTopics: HelpTopic[];
}

const HelpTopicProvider: React.FC<HelpTopicProviderProps> = ({ children, helpTopics }) => {
  const inContextHelpProps: HelpTopicContainerProps = {
    helpTopics,
    loading: false,
  };
  return <HelpTopicContainer {...inContextHelpProps}>{children}</HelpTopicContainer>;
};

export default HelpTopicProvider;

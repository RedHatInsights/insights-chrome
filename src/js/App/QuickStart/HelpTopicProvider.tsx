import React from 'react';
import { HelpTopicContainer, HelpTopicContainerProps } from '@patternfly/quickstarts';

import dataMock from './helpTopicDataMock.json';

const HelpTopicProvider: React.FC = ({ children }) => {
  const inContextHelpProps: HelpTopicContainerProps = {
    helpTopics: dataMock,
    loading: false,
  };
  return <HelpTopicContainer {...inContextHelpProps}>{children}</HelpTopicContainer>;
};

export default HelpTopicProvider;

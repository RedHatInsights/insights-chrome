import { HelpTopic } from '@patternfly/quickstarts';
import { useState } from 'react';

const useHelpTopicState = (...topics: HelpTopic[]) => {
  const [helpTopics, setHelpTopics] = useState<HelpTopic[]>(topics);

  function updateHelpTopics(...topics: HelpTopic[]) {
    setHelpTopics((prev) => {
      /** Add or update new topics based on topics name */
      return topics.reduce((acc, curr) => {
        const topicIndex = acc.findIndex(({ name }) => name === curr.name);
        if (topicIndex > -1) {
          return [...acc.slice(0, topicIndex), curr, ...acc.slice(topicIndex + 1)];
        }
        return [...acc, curr];
      }, prev);
    });
  }

  return {
    helpTopics,
    updateHelpTopics,
  };
};

export default useHelpTopicState;

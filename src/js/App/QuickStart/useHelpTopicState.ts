import { HelpTopic } from '@patternfly/quickstarts';
import { useRef, useState } from 'react';

const useHelpTopicState = (...topics: HelpTopic[]) => {
  const [helpTopics, setHelpTopics] = useState<HelpTopic[]>(topics);
  /**
   * There is a bug in help topics provider.
   * It does not update the context after first render.
   * We use the render count to update the component key and force-reinitialization
   * */
  const updates = useRef(0);

  function updateHelpTopics(...topics: HelpTopic[]) {
    setHelpTopics((prev) => {
      /** Add or update new topics based on topics name */
      return topics.reduce((acc, curr) => {
        const topicIndex = acc.findIndex(({ name }) => name === curr.name);
        if (topicIndex > -1) {
          return [...acc.slice(0, topicIndex), curr, ...acc.slice(topicIndex + 1)];
        }
        updates.current += 1;
        return [...acc, curr];
      }, prev);
    });
  }

  return {
    helpTopics,
    updateHelpTopics,
    updates: updates.current,
  };
};

export default useHelpTopicState;

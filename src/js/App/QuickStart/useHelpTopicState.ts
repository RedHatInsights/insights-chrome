import { HelpTopic } from '@patternfly/quickstarts';
import { useState } from 'react';

type HelpTopicsState = {
  topics?: {
    [name: string]: HelpTopic;
  };
  activeTopics?: {
    [name: string]: boolean;
  };
};

const useHelpTopicState = (state: HelpTopicsState = { topics: {}, activeTopics: {} }) => {
  const [helpTopics, setHelpTopics] = useState<{
    [name: string]: HelpTopic;
  }>(state.topics || {});
  const [activeTopics, setActiveTopics] = useState<{
    [name: string]: boolean;
  }>(state.activeTopics || {});

  function batchToggleTopic(names: string[], active: boolean) {
    setActiveTopics((prev) =>
      names.reduce(
        (acc, curr) => ({
          ...acc,
          [curr]: active,
        }),
        { ...prev }
      )
    );
  }

  /**
   * Add new or replace exiting topics
   * New topics
   */
  function addHelpTopics(topics: HelpTopic[], enabled = true) {
    setHelpTopics((prev) =>
      topics.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.name]: curr,
        }),
        { ...prev }
      )
    );
    batchToggleTopic(
      topics.map(({ name }) => name),
      enabled
    );
  }

  function enableTopics(...topicsNames: string[]) {
    batchToggleTopic(topicsNames, true);
  }

  function disableTopics(...topicsNames: string[]) {
    batchToggleTopic(topicsNames, false);
  }

  return {
    helpTopics: Object.values(helpTopics).filter(({ name }) => activeTopics?.[name]),
    addHelpTopics,
    disableTopics,
    enableTopics,
  };
};

export default useHelpTopicState;

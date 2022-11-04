import { HelpTopic } from '@patternfly/quickstarts';
import instance from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import { useState } from 'react';

type HelpTopicsState = {
  topics?: {
    [name: string]: HelpTopic;
  };
  activeTopics?: {
    [name: string]: boolean;
  };
};

export type AddHelpTopic = (topics: HelpTopic[], enabled?: boolean) => void;
export type DisableTopics = (...topicsNames: string[]) => void;
export type EnableTopics = (...topicNames: string[]) => Promise<void[]>;

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
  const addHelpTopics: AddHelpTopic = (topics: HelpTopic[], enabled = true) => {
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
  };

  function appendQueryArray(params: URLSearchParams, name: string, values: string[]) {
    values.forEach((value) => {
      params.append(name, value);
    });
    return params;
  }

  async function fetchHelpTopics({
    bundles = [],
    applications = [],
    names = [],
    enabled = true,
  }: {
    enabled?: boolean;
    bundles?: string[];
    applications?: string[];
    names?: string[];
  }) {
    let params = new URLSearchParams('');
    params = appendQueryArray(params, 'bundle', bundles);
    params = appendQueryArray(params, 'application', applications);
    params = appendQueryArray(params, 'name', names);

    try {
      const { data } = await instance.get<{ content: HelpTopic }[]>(`/api/quickstarts/v1/helptopics?${params.toString()}`);
      addHelpTopics(
        data.map(({ content }) => content),
        enabled
      );
    } catch (error) {
      console.error('Unable to fetch help topics', error);
    }
  }

  const enableTopics: EnableTopics = async (...topicsNames: string[]) => {
    const newTopics: string[] = [];
    const existingTopics: string[] = [];
    topicsNames.forEach((name) => {
      if (typeof helpTopics[name] === 'undefined') {
        newTopics.push(name);
      } else {
        existingTopics.push(name);
      }
    });
    const tasks = [];
    if (newTopics.length > 0) {
      tasks.push(fetchHelpTopics({ enabled: true, names: newTopics }));
    }
    batchToggleTopic(existingTopics, true);
    return await Promise.all(tasks);
  };

  const disableTopics: DisableTopics = (...topicsNames: string[]) => {
    batchToggleTopic(topicsNames, false);
  };

  return {
    helpTopics: Object.values(helpTopics).filter(({ name }) => activeTopics?.[name]),
    addHelpTopics,
    disableTopics,
    enableTopics,
  };
};

export default useHelpTopicState;

import { HelpTopic } from '@patternfly/quickstarts';
import instance from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import { Reducer, useReducer } from 'react';

export type AddHelpTopic = (topics: HelpTopic[], enabled?: boolean) => void;
export type DisableTopics = (...topicsNames: string[]) => void;
export type EnableTopics = (...topicNames: string[]) => Promise<HelpTopic[]>;

type HelpTopicsState = {
  helpTopics: {
    [name: string]: HelpTopic;
  };
  activeTopics: {
    [name: string]: boolean;
  };
};

type HelpTopicsAction = {
  type: 'setActiveTopics' | 'setHelpTopics';
  activeTopics?: string[];
  helpTopics?: HelpTopic[];
  active?: boolean;
};

const helpTopicsReducer: Reducer<HelpTopicsState, HelpTopicsAction> = (state, action) => {
  switch (action.type) {
    case 'setActiveTopics':
      return {
        ...state,
        activeTopics: (action.activeTopics || []).reduce(
          (acc, curr) => ({
            ...acc,
            [curr]: !!action.active,
          }),
          { ...state.activeTopics }
        ),
      };
    case 'setHelpTopics':
      return {
        ...state,
        helpTopics: (action.helpTopics || []).reduce(
          (acc, curr) => ({
            ...acc,
            [curr.name]: curr,
          }),
          { ...state.helpTopics }
        ),
      };

    default:
      return state;
  }
};

const useHelpTopicState = (initialState: Partial<HelpTopicsState> = { activeTopics: {}, helpTopics: {} }) => {
  const [state, dispatch] = useReducer(helpTopicsReducer, {
    activeTopics: initialState.activeTopics || {},
    helpTopics: initialState.helpTopics || {},
  });

  function batchToggleTopic(names: string[], active: boolean) {
    dispatch({ type: 'setActiveTopics', activeTopics: names, active });
  }

  /**
   * Add new or replace exiting topics
   * New topics
   */
  const addHelpTopics: AddHelpTopic = (topics: HelpTopic[], enabled = true) => {
    dispatch({ type: 'setHelpTopics', helpTopics: topics });
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
      const content = data.map(({ content }) => content);
      addHelpTopics(content, enabled);
      return content;
    } catch (error) {
      console.error('Unable to fetch help topics', error);
      return [];
    }
  }

  function enableTopics(...topicsNames: string[]) {
    const newTopics: string[] = [];
    const existingTopics: string[] = [];
    topicsNames.forEach((name) => {
      if (typeof state.helpTopics[name] === 'undefined') {
        newTopics.push(name);
      } else {
        existingTopics.push(name);
      }
    });
    const tasks = [];
    if (newTopics.length > 0) {
      tasks.push(fetchHelpTopics({ enabled: true, names: newTopics }));
    }
    const existingContent: HelpTopic[] = Object.entries(state.helpTopics).reduce<HelpTopic[]>(
      (acc, [name, topic]) => [...acc, ...(topicsNames.includes(name) ? [topic] : [])],
      []
    );
    batchToggleTopic(existingTopics, true);
    return Promise.all(tasks).then((res) => [...res.flat(), ...existingContent]);
  }

  const disableTopics: DisableTopics = (...topicsNames: string[]) => {
    batchToggleTopic(topicsNames, false);
  };

  return {
    helpTopics: Object.values(state.helpTopics).filter(({ name }) => state.activeTopics?.[name]),
    addHelpTopics,
    disableTopics,
    enableTopics,
  };
};

export default useHelpTopicState;

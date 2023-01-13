import { Reducer, useContext, useEffect, useReducer } from 'react';
import { HelpTopicContext } from '@patternfly/quickstarts';
import { HelpTopicsAPI } from '../../@types/types';

type HelpTopicState = {
  activeTopicName?: string;
  prevActiveTopic?: string;
  internalTopicsSwitch: boolean;
};

type HelpTopicActions = 'clearActiveTopic' | 'setActiveTopic' | 'setActiveTopicExternal' | 'setActiveTopicInternal' | 'resetActiveTopic';

type HelpTopicAction = {
  type: HelpTopicActions;
  activeTopicName?: string;
  prevActiveTopic?: string;
};

const helpTopicsReducer: Reducer<HelpTopicState, HelpTopicAction> = (state, action) => {
  switch (action.type) {
    case 'setActiveTopic':
      return {
        ...state,
        activeTopicName: action.activeTopicName,
        prevActiveTopic: action.prevActiveTopic,
        internalTopicsSwitch: false,
      };
    case 'setActiveTopicExternal':
      return {
        ...state,
        internalTopicsSwitch: false,
        prevActiveTopic: action.prevActiveTopic,
      };
    case 'setActiveTopicInternal':
      return {
        ...state,
        prevActiveTopic: action.prevActiveTopic,
        internalTopicsSwitch: true,
      };
    case 'resetActiveTopic': {
      return {
        ...state,
        prevActiveTopic: undefined,
        internalTopicsSwitch: false,
      };
    }
    default:
      return state;
  }
};

const useHelpTopicManager = (helpTopicsAPI: HelpTopicsAPI) => {
  const [{ activeTopicName, internalTopicsSwitch, prevActiveTopic }, dispatch] = useReducer(helpTopicsReducer, {
    internalTopicsSwitch: false,
  });

  const { setActiveHelpTopicByName, helpTopics, activeHelpTopic } = useContext(HelpTopicContext);

  async function setActiveTopic(activeTopicName: string, prevActiveTopic?: string) {
    dispatch({ type: 'setActiveTopic', activeTopicName, prevActiveTopic });
    if (activeTopicName?.length > 0) {
      helpTopicsAPI.enableTopics(activeTopicName);
    }
  }

  useEffect(() => {
    /**
     * We can't call the setActiveHelpTopicByName directly after we populate the context with new value
     * The quickstarts module returns a undefined value
     * TODO: Fix it in the quickstarts repository
     */
    if (prevActiveTopic && activeHelpTopic === null) {
      setActiveTopic('', undefined);
    } else {
      if (activeHelpTopic?.name && prevActiveTopic === activeTopicName && activeHelpTopic?.name !== activeTopicName) {
        // switching topics via the drawer dropdown
        setActiveHelpTopicByName && setActiveHelpTopicByName(activeHelpTopic.name);
        dispatch({ type: 'setActiveTopicInternal', prevActiveTopic });
      } else if (typeof activeTopicName === 'string' && activeTopicName?.length > 0) {
        // switching from outside of the drawer
        if (helpTopics?.find(({ name }) => name === activeTopicName)) {
          setActiveHelpTopicByName && setActiveHelpTopicByName(activeTopicName);
          dispatch({ type: 'setActiveTopicExternal', prevActiveTopic: activeTopicName });
        }
      } else {
        // clearing active topic
        setActiveHelpTopicByName && setActiveHelpTopicByName('');
        dispatch({ type: 'resetActiveTopic' });
      }
    }
    // active help topic has to be in the list to reset the active topic name
  }, [activeTopicName, helpTopics, activeHelpTopic, internalTopicsSwitch]);
  return {
    setActiveTopic,
  };
};

export default useHelpTopicManager;

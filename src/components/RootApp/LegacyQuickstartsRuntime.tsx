import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { HelpTopic, HelpTopicContainer, HelpTopicContext, QuickStart, QuickStartContainer, QuickStartContainerProps } from '@patternfly/quickstarts';
import { ChromeAPI, EnableTopicsArgs } from '@redhat-cloud-services/types';
import { useAtomValue, useSetAtom } from 'jotai';
import useQuickstartsStates from '../QuickStart/useQuickstartsStates';
import useHelpTopicState from '../QuickStart/useHelpTopicState';
import useHelpTopicManager from '../QuickStart/useHelpTopicManager';
import validateQuickstart from '../QuickStart/quickstartValidation';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';
import useQuickstartLinkStore, { createQuickstartLinkMarkupExtension } from '../../hooks/useQuickstarLinksStore';
import { addQuickstartToAppAtom, clearQuickstartsAtom, populateQuickstartsAppAtom, quickstartsAtom } from '../../state/atoms/quickstartsAtom';
import { LiveQuickstartsAPI } from '../../state/atoms/remoteQuickstartsAtom';

export type LegacyQuickstartsRuntimeProps = {
  accountId?: string;
  activeModule?: string;
  children?: React.ReactNode;
  onApiReady?: (api: { quickstartsAPI: LiveQuickstartsAPI; helpTopicsAPI: ChromeAPI['helpTopics'] }) => void;
  onActiveQuickStartChanged?: (id: string) => void;
};

function isStringArray(arr: EnableTopicsArgs): arr is string[] {
  return typeof arr[0] === 'string';
}

type ApiPublisherProps = {
  baseHelpTopicsAPI: ReturnType<typeof useHelpTopicState>;
  quickstartsAPI: LiveQuickstartsAPI;
  activeModule?: string;
  onApiReady?: LegacyQuickstartsRuntimeProps['onApiReady'];
};

const ApiPublisher = ({ baseHelpTopicsAPI, quickstartsAPI, activeModule, onApiReady }: ApiPublisherProps) => {
  const { setFilteredHelpTopics } = useContext(HelpTopicContext);
  const internalFilteredTopics = useRef<HelpTopic[]>([]);
  const { setActiveTopic } = useHelpTopicManager(baseHelpTopicsAPI);

  const enableTopics = useCallback(
    async (...names: EnableTopicsArgs) => {
      let internalNames: string[] = [];
      let shouldAppend = false;
      if (isStringArray(names)) {
        internalNames = names;
      } else {
        internalNames = names[0].names;
        shouldAppend = !!names[0].append;
      }
      return baseHelpTopicsAPI.enableTopics(...internalNames).then((res) => {
        internalFilteredTopics.current = shouldAppend
          ? [...internalFilteredTopics.current, ...res.filter((topic) => !internalFilteredTopics.current.find(({ name }) => name === topic.name))]
          : res;
        setFilteredHelpTopics?.(internalFilteredTopics.current);
        return res;
      });
    },
    [baseHelpTopicsAPI, setFilteredHelpTopics]
  );

  const disableTopics = useCallback(
    (...topicsNames: string[]) => {
      baseHelpTopicsAPI.disableTopics(...topicsNames);
      internalFilteredTopics.current = internalFilteredTopics.current.filter((topic) => !topicsNames.includes(topic.name));
      setFilteredHelpTopics?.(internalFilteredTopics.current);
    },
    [baseHelpTopicsAPI, setFilteredHelpTopics]
  );

  const closeHelpTopic = useCallback(() => {
    setActiveTopic('');
  }, [setActiveTopic]);

  const fullHelpTopicsAPI: ChromeAPI['helpTopics'] = useMemo(
    () => ({
      addHelpTopics: baseHelpTopicsAPI.addHelpTopics,
      enableTopics,
      disableTopics,
      setActiveTopic,
      closeHelpTopic,
    }),
    [baseHelpTopicsAPI.addHelpTopics, enableTopics, disableTopics, setActiveTopic, closeHelpTopic]
  );

  useEffect(() => {
    onApiReady?.({ quickstartsAPI, helpTopicsAPI: fullHelpTopicsAPI });
  }, [onApiReady, quickstartsAPI, fullHelpTopicsAPI]);

  useEffect(() => {
    setActiveTopic('');
  }, [activeModule]);

  return null;
};

/**
 * Flag-off fallback: leftover Chrome QuickStart implementation.
 * Same onApiReady contract as the learning-resources remote.
 */
const LegacyQuickstartsRuntime = ({ accountId, activeModule, children, onApiReady, onActiveQuickStartChanged }: LegacyQuickstartsRuntimeProps) => {
  const quickstartLinkStore = useQuickstartLinkStore();
  const { activateQuickstart, allQuickStartStates, setAllQuickStartStates, activeQuickStartID, setActiveQuickStartID } = useQuickstartsStates(accountId);
  const baseHelpTopicsAPI = useHelpTopicState();
  const quickstartsData = useAtomValue(quickstartsAtom);
  const quickStarts = useMemo(() => Object.values(quickstartsData).flat(), [quickstartsData]);
  const clearQuickstarts = useSetAtom(clearQuickstartsAtom);
  const populateQuickstarts = useSetAtom(populateQuickstartsAppAtom);
  const addQuickstartToApp = useSetAtom(addQuickstartToAppAtom);

  useEffect(() => {
    clearQuickstarts(activeQuickStartID);
  }, [activeModule]);

  useEffect(() => {
    onActiveQuickStartChanged?.(activeQuickStartID);
  }, [activeQuickStartID]);

  const updateQuickStarts = useCallback(
    (key: string, qs: QuickStart[]) => {
      populateQuickstarts({ app: key, quickstarts: qs });
    },
    [populateQuickstarts]
  );

  const addQuickstart = useCallback(
    (key: string, qs: QuickStart): boolean => {
      if (validateQuickstart(key, qs)) {
        addQuickstartToApp({ app: key, quickstart: qs });
        return true;
      }
      return false;
    },
    [addQuickstartToApp]
  );

  const quickstartsAPI: LiveQuickstartsAPI = useMemo(
    () => ({
      version: 1,
      set: updateQuickStarts,
      activateQuickstart,
      add: addQuickstart,
      toggle: setActiveQuickStartID,
      Catalog: LazyQuickStartCatalog,
      updateQuickStarts,
    }),
    [activateQuickstart, setActiveQuickStartID, updateQuickStarts, addQuickstart]
  );

  const quickStartProps: QuickStartContainerProps = {
    quickStarts,
    activeQuickStartID,
    allQuickStartStates,
    setActiveQuickStartID: setActiveQuickStartID as QuickStartContainerProps['setActiveQuickStartID'],
    setAllQuickStartStates: setAllQuickStartStates as unknown as QuickStartContainerProps['setAllQuickStartStates'],
    showCardFooters: false,
    language: 'en',
    alwaysShowTaskReview: true,
    markdown: {
      extensions: [createQuickstartLinkMarkupExtension(quickstartLinkStore)],
    },
  };

  return (
    <QuickStartContainer {...quickStartProps}>
      <HelpTopicContainer helpTopics={baseHelpTopicsAPI.helpTopics}>
        <ApiPublisher baseHelpTopicsAPI={baseHelpTopicsAPI} quickstartsAPI={quickstartsAPI} activeModule={activeModule} onApiReady={onApiReady} />
        {children}
      </HelpTopicContainer>
    </QuickStartContainer>
  );
};

export default LegacyQuickstartsRuntime;

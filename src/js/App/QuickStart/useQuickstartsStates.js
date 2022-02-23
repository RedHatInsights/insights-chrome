import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocalStorage } from '@patternfly/quickstarts';
import { getEnv } from '../../utils';

const isStage = getEnv() === 'stage';

const statePersistor = isStage ? useState : useLocalStorage;
const initiStatesArgs = ['insights-quickstarts', {}];
const initialIdArgs = isStage ? ['', ''] : [undefined];

const useQuickstartsStates = () => {
  const accountId = useSelector(({ chrome }) => chrome?.user?.identity?.internal?.account_id);
  const [allQuickStartStates, setAllQuickStartStatesInternal] = statePersistor(...initiStatesArgs);
  const [activeQuickStartID, setActiveQuickStartIDInternal] = statePersistor(...initialIdArgs);

  function setAllQuickStartStates(...args) {
    if (!isStage) {
      return setAllQuickStartStatesInternal(...args);
    }
    const [value] = args;
    const valueToStore = typeof value === 'function' ? value(allQuickStartStates) : value;
    const activeState = valueToStore[activeQuickStartID];
    if (typeof activeState === 'object') {
      axios
        .post('/api/quickstarts/v1/progress', {
          quickstartName: activeQuickStartID,
          accountId: parseInt(accountId),
          progress: activeState,
        })
        .catch((err) => {
          console.error(`Unable to persis quickstart progress! ${activeQuickStartID}`, err);
        });
    }
    setAllQuickStartStatesInternal(valueToStore);
  }

  function setActiveQuickStartID(...args) {
    if (!isStage) {
      return setActiveQuickStartIDInternal(...args);
    }
    const [id] = args;
    setActiveQuickStartIDInternal(id);
  }

  useEffect(() => {
    if (accountId) {
      axios
        .get('/api/quickstarts/v1/progress', {
          params: {
            account: accountId,
          },
        })
        .then(({ data: { data } }) => {
          const states = data.reduce(
            (acc, curr) => ({
              ...acc,
              [curr.quickstartName]: curr.progress,
            }),
            {}
          );
          setAllQuickStartStates(states);
        });
    }
  }, [accountId]);

  return {
    allQuickStartStates,
    setAllQuickStartStates,
    activeQuickStartID,
    setActiveQuickStartID,
  };
};

export default useQuickstartsStates;

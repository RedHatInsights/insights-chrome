import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { QuickStartState } from '@patternfly/quickstarts';
import { ReduxState } from '../../redux/store';

const useQuickstartsStates = () => {
  const accountId = useSelector(({ chrome }: ReduxState) => chrome?.user?.identity?.internal?.account_id);
  const [allQuickStartStates, setAllQuickStartStatesInternal] = useState<{ [key: string | number]: QuickStartState }>({});
  const [activeQuickStartID, setActiveQuickStartIDInternal] = useState('');

  function setAllQuickStartStates(value: QuickStartState | ((states: typeof allQuickStartStates) => QuickStartState)) {
    const valueToStore = typeof value === 'function' ? value(allQuickStartStates) : value;
    const activeState = valueToStore[activeQuickStartID];

    if (typeof activeState === 'object') {
      axios
        .post('/api/quickstarts/v1/progress', {
          quickstartName: activeQuickStartID,
          accountId: parseInt(accountId!),
          progress: activeState,
        })
        .catch((err) => {
          console.error(`Unable to persis quickstart progress! ${activeQuickStartID}`, err);
        });
    }
    setAllQuickStartStatesInternal(value as unknown as typeof allQuickStartStates);
  }

  function setActiveQuickStartID(id: string) {
    id !== '' && typeof id !== 'function' ? document.body.classList.add('quickstarts-open') : document.body.classList.remove('quickstarts-open');
    setActiveQuickStartIDInternal(id);
  }

  useEffect(() => {
    if (accountId) {
      axios
        .get<{ data: { quickstartName: string; progress: QuickStartState }[] }>('/api/quickstarts/v1/progress', {
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
        })
        .catch((error) => {
          console.error(error);
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

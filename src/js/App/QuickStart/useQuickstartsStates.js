import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const useQuickstartsStates = () => {
  const accountId = useSelector(({ chrome }) => chrome?.user?.identity?.internal?.account_id);
  const [allQuickStartStates, setAllQuickStartStatesInternal] = useState({});
  const [activeQuickStartID, setActiveQuickStartIDInternal] = useState(undefined);

  function setAllQuickStartStates(value) {
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

  function setActiveQuickStartID(id) {
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

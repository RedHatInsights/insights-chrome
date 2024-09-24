import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { QuickStart, QuickStartState } from '@patternfly/quickstarts';
import { useSetAtom } from 'jotai';
import { populateQuickstartsAppAtom } from '../../state/atoms/quickstartsAtom';

const useQuickstartsStates = (accountId?: string) => {
  const populateQuickstarts = useSetAtom(populateQuickstartsAppAtom);

  const [allQuickStartStates, setAllQuickStartStatesInternal] = useState<{ [key: string | number]: QuickStartState }>({});
  const [activeQuickStartID, setActiveQuickStartIDInternal] = useState('');

  const setAllQuickStartStates = useCallback(
    (value: QuickStartState | ((states: typeof allQuickStartStates) => QuickStartState)) => {
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
    },
    [setAllQuickStartStatesInternal, activeQuickStartID, accountId]
  );

  const setActiveQuickStartID = useCallback(
    (id: string) => {
      id !== '' && typeof id !== 'function' ? document.body.classList.add('quickstarts-open') : document.body.classList.remove('quickstarts-open');
      setActiveQuickStartIDInternal(id);
    },
    [setActiveQuickStartIDInternal]
  );

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

  const activateQuickstart = useCallback(
    async (name: string) => {
      try {
        const {
          data: { data },
        } = await axios.get<{ data: { content: QuickStart }[] }>('/api/quickstarts/v1/quickstarts', {
          params: {
            name,
          },
        });
        populateQuickstarts({
          app: 'default',
          quickstarts: data.map(({ content }) => content),
        });

        setActiveQuickStartID(name);
      } catch (error) {
        console.error('Unable to active quickstarts called: ', name, error);
      }
    },
    [populateQuickstarts, setActiveQuickStartID]
  );

  useEffect(() => {
    // this hook is above the router node this the window location usage
    const params = new URLSearchParams(window.location.search);
    // load quickatart if URL param is present
    const quickstartParam = params.get('quickstart');
    if (typeof quickstartParam === 'string' && quickstartParam.length > 0) {
      activateQuickstart(quickstartParam);
    }
  }, []);

  // make sure the API is not created on every render
  const quickstartState = useMemo(
    () => ({
      activateQuickstart,
      allQuickStartStates,
      setAllQuickStartStates,
      activeQuickStartID,
      setActiveQuickStartID,
    }),
    [activateQuickstart, allQuickStartStates, setAllQuickStartStates, activeQuickStartID, setActiveQuickStartID]
  );

  return quickstartState;
};

export default useQuickstartsStates;

import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { QuickStart, QuickStartState } from '@patternfly/quickstarts';
import { useSetAtom } from 'jotai';
import { populateQuickstartsAppAtom } from '../../state/atoms/quickstartsAtom';

// API response types
interface QuickStartAPIResponse {
  data: { content: QuickStart }[];
}

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
      if (id !== '' && typeof id !== 'function') {
        document.body.classList.add('quickstarts-open');
      } else {
        document.body.classList.remove('quickstarts-open');
      }
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
        // 1. Fetch main quickstart
        const {
          data: { data },
        } = await axios.get<QuickStartAPIResponse>('/api/quickstarts/v1/quickstarts', {
          params: {
            name,
          },
        });
        const mainQuickstarts = data.map(({ content }) => content);

        // 2. Extract nextQuickStart references
        const nextQuickStartNames = mainQuickstarts.flatMap((qs) => qs.spec.nextQuickStart || []).filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates

        // 3. Fetch referenced quickstarts
        let nextQuickstarts: QuickStart[] = [];
        if (nextQuickStartNames.length > 0) {
          try {
            const promises = nextQuickStartNames.map((nextName) =>
              axios.get<QuickStartAPIResponse>('/api/quickstarts/v1/quickstarts', {
                params: { name: nextName },
              })
            );
            const responses = await Promise.all(promises);
            nextQuickstarts = responses.flatMap((r) => r.data.data.map(({ content }) => content));
          } catch (error) {
            console.warn('Some referenced quickstarts could not be fetched:', error);
            // Continue without the referenced quickstarts
          }
        }

        // 4. Populate both main and referenced quickstarts
        populateQuickstarts({
          app: 'default',
          quickstarts: [...mainQuickstarts, ...nextQuickstarts],
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

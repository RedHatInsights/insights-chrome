import React, { useCallback, useEffect, useRef } from 'react';
import { Router } from 'react-router-dom';
import { HelpTopicContainer, QuickStartContainer } from '@patternfly/quickstarts';

import { isBeta } from '../../utils';
import chromeHistory from '../../utils/chromeHistory';
import { FeatureFlagsProvider } from '../FeatureFlags';
import IDPChecker from './IDPChecker';
import ScalprumRoot from './ScalprumRoot';
import { useDispatch, useSelector } from 'react-redux';
import useQuickstartsStates from '../QuickStart/useQuickstartsStates';
import { populateQuickstartsCatalog } from '../../redux/actions';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';
import useHelpTopicState from '../QuickStart/useHelpTopicState';
import Notifications from '../Notifications';

const useEvents = () => {
  console.log('Use events was for some reason triggered');
  const events = useRef({});
  const conn = useRef();
  const activeModule = useSelector(({ chrome: { activeModule } }) => activeModule);
  const dispatch = useDispatch();
  function handleEvent(payload) {
    if (payload.type === 'new-notification') {
      dispatch({ type: 'add-notification', payload });
    } else if (payload.type === 'invalidate') {
      Object.values(events.current)
        .flat()
        .forEach((cb) => {
          cb(payload);
        });
    }
    console.log(events);
  }

  /**
   * Establish connection
   */
  useEffect(() => {
    const x = new WebSocket('ws://localhost:8080/ws');
    x.onmessage = (messageEvent) => {
      const { data } = messageEvent;
      try {
        const payload = JSON.parse(data);
        handleEvent(payload);
      } catch (error) {
        console.error('Unable to parse WS message data: ', error);
      }
    };
    conn.current = x;
  }, []);

  const registerEvent = useCallback(
    (type, app, entity, cb) => {
      if (typeof app !== 'string' || typeof type !== 'string' || typeof entity !== 'string' || typeof cb !== 'function') {
        throw new Error('Invalid registerEvents parameters');
      }
      const listener = (data) => {
        if (data.type === type && data.app === app && data.entity === entity) {
          cb(data);
        }
      };
      if (Array.isArray(events.current[activeModule])) {
        events.current[activeModule].push(listener);
      } else {
        events.current[activeModule] = [listener];
      }
    },
    [activeModule]
  );

  return registerEvent;
};

const RootApp = (props) => {
  const dispatch = useDispatch();

  const registerEvent = useEvents();

  const { allQuickStartStates, setAllQuickStartStates, activeQuickStartID, setActiveQuickStartID } = useQuickstartsStates();
  const { helpTopics, addHelpTopics, disableTopics, enableTopics } = useHelpTopicState();
  const quickStarts = useSelector(
    ({
      chrome: {
        quickstarts: { quickstarts },
      },
    }) => Object.values(quickstarts).flat()
  );
  /**
   * Updates the available quick starts
   *
   * Usage example:
   * const { quickStarts } = useChrome();
   * quickStarts.set('applicationServices', quickStartsArray)
   *
   * @param {string} key App identifier
   * @param {array} qs Array of quick starts
   */
  const updateQuickStarts = (key, qs) => {
    dispatch(populateQuickstartsCatalog(key, qs));
  };

  const quickStartProps = {
    quickStarts,
    activeQuickStartID,
    allQuickStartStates,
    setActiveQuickStartID,
    setAllQuickStartStates,
    showCardFooters: false,
    language: 'en',
    alwaysShowTaskReview: true,
  };

  const helpTopicsAPI = {
    addHelpTopics,
    disableTopics,
    enableTopics,
  };

  const quickstartsAPI = {
    version: 1,
    set: updateQuickStarts,
    toggle: setActiveQuickStartID,
    Catalog: LazyQuickStartCatalog,
  };
  return (
    <Router history={chromeHistory} basename={isBeta() ? '/beta' : '/'}>
      <FeatureFlagsProvider>
        <IDPChecker>
          {/* <CrossRequestNotifier /> */}

          <QuickStartContainer className="pf-u-h-100vh" {...quickStartProps}>
            <HelpTopicContainer helpTopics={helpTopics}>
              <ScalprumRoot
                {...props}
                registerEvent={registerEvent}
                helpTopics={helpTopics}
                quickstartsAPI={quickstartsAPI}
                helpTopicsAPI={helpTopicsAPI}
              />
            </HelpTopicContainer>
          </QuickStartContainer>
        </IDPChecker>
      </FeatureFlagsProvider>
    </Router>
  );
};

export default RootApp;

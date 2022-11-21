import React, { useEffect } from 'react';
import { Router } from 'react-router-dom';
import { HelpTopicContainer, QuickStart, QuickStartContainer, QuickStartContainerProps } from '@patternfly/quickstarts';

import chromeHistory from '../../utils/chromeHistory';
import { FeatureFlagsProvider } from '../FeatureFlags';
import IDPChecker from '../IDPChecker/IDPChecker';
import ScalprumRoot from './ScalprumRoot';
import { useDispatch, useSelector } from 'react-redux';
import { clearQuickstarts, populateQuickstartsCatalog } from '../../redux/actions';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';
import useQuickstartsStates from '../QuickStart/useQuickstartsStates';
import useHelpTopicState from '../QuickStart/useHelpTopicState';
import validateQuickstart from '../QuickStart/quickstartValidation';
import SegmentProvider from '../../analytics/SegmentProvider';
import { ReduxState } from '../../redux/store';
import { AppsConfig } from '@scalprum/core';

export type RootAppProps = {
  config: AppsConfig;
};

const RootApp = (props: RootAppProps) => {
  const { allQuickStartStates, setAllQuickStartStates, activeQuickStartID, setActiveQuickStartID } = useQuickstartsStates();
  const { helpTopics, addHelpTopics, disableTopics, enableTopics } = useHelpTopicState();
  const dispatch = useDispatch();
  const activeModule = useSelector(({ chrome: { activeModule } }: ReduxState) => activeModule);
  const quickStarts = useSelector(
    ({
      chrome: {
        quickstarts: { quickstarts },
      },
    }: ReduxState) => Object.values(quickstarts).flat()
  );

  useEffect(() => {
    dispatch(clearQuickstarts(activeQuickStartID));
  }, [activeModule]);
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
  const updateQuickStarts = (key: string, qs: QuickStart[]) => {
    dispatch(populateQuickstartsCatalog(key, qs));
  };

  const addQuickstart = (key: string, qs: QuickStart): boolean => {
    return validateQuickstart(key, qs) ? !!dispatch(addQuickstart(key, qs)) : false;
  };

  const quickStartProps: QuickStartContainerProps = {
    quickStarts,
    activeQuickStartID,
    allQuickStartStates,
    setActiveQuickStartID: setActiveQuickStartID as QuickStartContainerProps['setActiveQuickStartID'],
    setAllQuickStartStates: setAllQuickStartStates as unknown as QuickStartContainerProps['setAllQuickStartStates'],
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
    add: addQuickstart,
    toggle: setActiveQuickStartID,
    Catalog: LazyQuickStartCatalog,
    updateQuickStarts,
  };
  return (
    <Router history={chromeHistory}>
      <SegmentProvider activeModule={activeModule!}>
        <FeatureFlagsProvider>
          <IDPChecker>
            {/* <CrossRequestNotifier /> */}

            <QuickStartContainer {...quickStartProps}>
              <HelpTopicContainer helpTopics={helpTopics}>
                <ScalprumRoot {...props} quickstartsAPI={quickstartsAPI} helpTopicsAPI={helpTopicsAPI} />
              </HelpTopicContainer>
            </QuickStartContainer>
          </IDPChecker>
        </FeatureFlagsProvider>
      </SegmentProvider>
    </Router>
  );
};

export default RootApp;

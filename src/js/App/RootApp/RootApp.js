import React from 'react';
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
import { SegmentProvider } from '../analytics/segment-analytics';

const RootApp = (props) => {
  const { allQuickStartStates, setAllQuickStartStates, activeQuickStartID, setActiveQuickStartID } = useQuickstartsStates();
  const { helpTopics, addHelpTopics, disableTopics, enableTopics } = useHelpTopicState();
  const dispatch = useDispatch();
  const activeModule = useSelector(({ chrome: { activeModule } }) => activeModule);
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
      <SegmentProvider activeModule={activeModule}>
        <FeatureFlagsProvider>
          <IDPChecker>
            {/* <CrossRequestNotifier /> */}

            <QuickStartContainer {...quickStartProps}>
              <HelpTopicContainer helpTopics={helpTopics}>
                <ScalprumRoot {...props} helpTopics={helpTopics} quickstartsAPI={quickstartsAPI} helpTopicsAPI={helpTopicsAPI} />
              </HelpTopicContainer>
            </QuickStartContainer>
          </IDPChecker>
        </FeatureFlagsProvider>
      </SegmentProvider>
    </Router>
  );
};

export default RootApp;

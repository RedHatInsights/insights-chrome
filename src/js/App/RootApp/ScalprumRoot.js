import React, { lazy, Suspense, useEffect } from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { Route, Switch, useHistory } from 'react-router-dom';
import { QuickStartContainer } from '@patternfly/quickstarts';

import DefaultLayout from './DefaultLayout';
import NavLoader from '../Sidenav/Navigation/Loader';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';
import { usePendoFeedback } from '../Feedback';
import { populateQuickstartsCatalog, toggleFeedbackModal } from '../../redux/actions';
import historyListener from '../../utils/historyListener';
import { isFedRamp } from '../../utils';
import useQuickstartsStates from '../QuickStart/useQuickstartsStates';
import HelpTopicProvider from '../QuickStart/HelpTopicProvider';
import useHelpTopicState from '../QuickStart/useHelpTopicState';

const Navigation = lazy(() => import('../Sidenav/Navigation'));
const LandingNav = lazy(() => import('../Sidenav/LandingNav'));

const loaderWrapper = (Component, props = {}) => (
  <Suspense fallback={<NavLoader />}>
    <Component {...props} />
  </Suspense>
);

const ScalprumRoot = ({ config, ...props }) => {
  const history = useHistory();
  const { allQuickStartStates, setAllQuickStartStates, activeQuickStartID, setActiveQuickStartID } = useQuickstartsStates();
  const { helpTopics, updateHelpTopics, updates } = useHelpTopicState();
  const globalFilterRemoved = useSelector(({ globalFilter: { globalFilterRemoved } }) => globalFilterRemoved);
  const dispatch = useDispatch();
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

  useEffect(() => {
    const unregister = history.listen(historyListener);
    return () => {
      if (typeof unregister === 'function') {
        return unregister();
      }
    };
  }, []);

  return (
    /**
     * Once all applications are migrated to chrome 2:
     * - define chrome API in chrome root after it mounts
     * - copy these functions to window
     * - add deprecation warning to the window functions
     */
    <QuickStartContainer className="pf-u-h-100vh" {...quickStartProps}>
      <HelpTopicProvider key={updates.toString()} helpTopics={helpTopics}>
        <ScalprumProvider
          config={config}
          api={{
            chrome: {
              experimentalApi: true,
              ...window.insights.chrome,
              isFedramp: isFedRamp(),
              usePendoFeedback,
              toggleFeedbackModal: (...args) => dispatch(toggleFeedbackModal(...args)),
              quickStarts: {
                version: 1,
                set: updateQuickStarts,
                toggle: setActiveQuickStartID,
                Catalog: LazyQuickStartCatalog,
              },
              helpTopics: {
                updateHelpTopics,
              },
              chromeHistory: history,
            },
          }}
        >
          <Switch>
            <Route exact path="/">
              <DefaultLayout Sidebar={loaderWrapper(LandingNav)} {...props} globalFilterRemoved={globalFilterRemoved} />
            </Route>
            <Route path="/security">
              <DefaultLayout {...props} globalFilterRemoved={globalFilterRemoved} />
            </Route>
            <Route>
              <DefaultLayout Sidebar={loaderWrapper(Navigation)} {...props} globalFilterRemoved={globalFilterRemoved} />
            </Route>
          </Switch>
        </ScalprumProvider>
      </HelpTopicProvider>
    </QuickStartContainer>
  );
};

ScalprumRoot.propTypes = {
  config: PropTypes.any,
};

export default ScalprumRoot;

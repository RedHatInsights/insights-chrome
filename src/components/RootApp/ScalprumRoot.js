import React, { Suspense, lazy, useCallback, useContext, useEffect, useState } from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import PropTypes from 'prop-types';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Route, Switch, useHistory } from 'react-router-dom';
import { HelpTopicContext } from '@patternfly/quickstarts';

import DefaultLayout from '../../layouts/DefaultLayout';
import NavLoader from '../../js/App/Sidenav/Navigation/Loader';
import { usePendoFeedback } from '../../components/Feedback';
import { toggleFeedbackModal } from '../../redux/actions';
import historyListener from '../../utils/historyListener';
import { isFedRamp } from '../../utils/common';
import SegmentContext from '../../analytics/SegmentContext';
import LoadingFallback from '../../utils/loading-fallback';
import { clearAnsibleTrialFlag, isAnsibleTrialFlagActive, setAnsibleTrialFlag } from '../../utils/isAnsibleTrialFlagActive';

const Navigation = lazy(() => import('../../js/App/Sidenav/Navigation'));
const LandingNav = lazy(() => import('../../js/App/Sidenav/LandingNav'));
const ProductSelection = lazy(() => import('../../components/Stratosphere/ProductSelection'));

const loaderWrapper = (Component, props = {}) => (
  <Suspense fallback={<NavLoader />}>
    <Component {...props} />
  </Suspense>
);

const useGlobalFilter = (callback) => {
  const selectedTags = useSelector(({ globalFilter: { selectedTags } }) => selectedTags, shallowEqual);
  return callback(selectedTags);
};

const ScalprumRoot = ({ config, helpTopicsAPI, quickstartsAPI, ...props }) => {
  const { setActiveHelpTopicByName, helpTopics, activeHelpTopic } = useContext(HelpTopicContext);
  const { analytics } = useContext(SegmentContext);
  const [activeTopicName, setActiveTopicName] = useState();
  const [prevActiveTopic, setPrevActiveTopic] = useState(activeHelpTopic?.name);
  const history = useHistory();
  const globalFilterRemoved = useSelector(({ globalFilter: { globalFilterRemoved } }) => globalFilterRemoved);
  const dispatch = useDispatch();

  async function setActiveTopic(name) {
    setActiveTopicName(name);
    if (name?.length > 0) {
      helpTopicsAPI.enableTopics(name);
    }
  }

  useEffect(() => {
    const unregister = history.listen(historyListener);
    return () => {
      if (typeof unregister === 'function') {
        return unregister();
      }
    };
  }, []);

  useEffect(() => {
    /**
     * We can't call the setActiveHelpTopicByName directly after we populate the context with new value
     * The quickstarts module returns a undefined value
     * TODO: Fix it in the quickstarts repository
     */
    if (prevActiveTopic && activeHelpTopic === null) {
      setActiveTopic('');
      setPrevActiveTopic();
    } else {
      if (activeTopicName?.length > 0) {
        if (helpTopics.find(({ name }) => name === activeTopicName)) {
          setActiveHelpTopicByName(activeTopicName);
          setPrevActiveTopic(activeTopicName);
        }
      } else {
        setActiveHelpTopicByName('');
        setPrevActiveTopic();
      }
    }
  }, [activeTopicName, helpTopics, activeHelpTopic]);

  const setPageMetadata = useCallback((pageOptions) => {
    window._segment = {
      ...window._segment,
      pageOptions,
    };
  }, []);

  return (
    /**
     * Once all applications are migrated to chrome 2:
     * - define chrome API in chrome root after it mounts
     * - copy these functions to window
     * - add deprecation warning to the window functions
     */
    <ScalprumProvider
      config={config}
      api={{
        chrome: {
          experimentalApi: true,
          ...window.insights.chrome,
          isFedramp: isFedRamp(),
          usePendoFeedback,
          segment: {
            setPageMetadata,
          },
          toggleFeedbackModal: (...args) => dispatch(toggleFeedbackModal(...args)),
          quickStarts: quickstartsAPI,
          helpTopics: {
            ...helpTopicsAPI,
            setActiveTopic,
            closeHelpTopic: () => {
              setActiveTopic('');
            },
          },
          clearAnsibleTrialFlag,
          isAnsibleTrialFlagActive,
          setAnsibleTrialFlag,
          chromeHistory: history,
          analytics,
          useGlobalFilter,
        },
      }}
    >
      <Switch>
        <Route exact path="/">
          <DefaultLayout Sidebar={loaderWrapper(LandingNav)} {...props} globalFilterRemoved={globalFilterRemoved} />
        </Route>
        <Route exact path="/connect/products">
          <Suspense fallback={LoadingFallback}>
            <ProductSelection />
          </Suspense>
        </Route>
        <Route path="/connect">
          <DefaultLayout {...props} globalFilterRemoved={globalFilterRemoved} />
        </Route>
        <Route path="/security">
          <DefaultLayout {...props} globalFilterRemoved={globalFilterRemoved} />
        </Route>
        <Route>
          <DefaultLayout Sidebar={loaderWrapper(Navigation)} {...props} globalFilterRemoved={globalFilterRemoved} />
        </Route>
      </Switch>
    </ScalprumProvider>
  );
};

ScalprumRoot.propTypes = {
  config: PropTypes.any,
  helpTopicsAPI: PropTypes.shape({
    addHelpTopics: PropTypes.func.isRequired,
    disableTopics: PropTypes.func.isRequired,
    enableTopics: PropTypes.func.isRequired,
  }).isRequired,
  quickstartsAPI: PropTypes.shape({
    version: PropTypes.number.isRequired,
    set: PropTypes.func.isRequired,
    toggle: PropTypes.func.isRequired,
    Catalog: PropTypes.elementType.isRequired,
  }).isRequired,
};

export default ScalprumRoot;

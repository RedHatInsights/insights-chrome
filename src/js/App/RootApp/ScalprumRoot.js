import React, { Fragment, lazy, Suspense, useEffect, useState } from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { Route, Switch, useHistory } from 'react-router-dom';
import { QuickStartContainer, useLocalStorage } from '@patternfly/quickstarts';

import DefaultLayout from './DefaultLayout';
import NavLoader from '../Sidenav/Navigation/Loader';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';
import { usePendoFeedback } from '../Feedback';
import { disableQuickstarts, populateQuickstartsCatalog, toggleFeedbackModal } from '../../redux/actions';
import historyListener from '../../utils/historyListener';
import { isFedRamp } from '../../utils';

const Navigation = lazy(() => import('../Sidenav/Navigation'));
const LandingNav = lazy(() => import('../Sidenav/LandingNav'));

const loaderWrapper = (Component, props = {}) => (
  <Suspense fallback={<NavLoader />}>
    <Component {...props} />
  </Suspense>
);

const loadQS = async () => {
  const {
    data: { data },
  } = await axios.get('/api/quickstarts/v1/quickstarts');
  return data.map(({ content }) => content);
};

const QSWrapper = ({ quickstartsLoaded, children, ...props }) =>
  quickstartsLoaded ? <QuickStartContainer {...props}>{children}</QuickStartContainer> : <Fragment>{children}</Fragment>;

QSWrapper.propTypes = {
  children: PropTypes.node,
  quickstartsLoaded: PropTypes.bool,
};

const ScalprumRoot = ({ config, ...props }) => {
  const history = useHistory();
  const globalFilterRemoved = useSelector(({ globalFilter: { globalFilterRemoved } }) => globalFilterRemoved);
  const dispatch = useDispatch();
  const [quickstartsLoaded, setQuickstarsLoaded] = useState(false);
  const [activeQuickStartID, setActiveQuickStartID] = useLocalStorage('insights-quickstartId', '');
  const [allQuickStartStates, setAllQuickStartStates] = useLocalStorage('insights-quickstarts', {});
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
  };

  useEffect(() => {
    const unregister = history.listen(historyListener);
    loadQS()
      .then((qs) => {
        dispatch(populateQuickstartsCatalog('all', qs));
        setQuickstarsLoaded(true);
      })
      .catch(() => {
        dispatch(disableQuickstarts());
        setQuickstarsLoaded(true);
      });
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
    <QSWrapper quickstartsLoaded={quickstartsLoaded} className="inc-c-chrome__root-element" {...quickStartProps}>
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
    </QSWrapper>
  );
};

ScalprumRoot.propTypes = {
  config: PropTypes.any,
};

export default ScalprumRoot;

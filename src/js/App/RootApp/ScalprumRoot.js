import React, { lazy, Suspense, useState } from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { QuickStartContainer, useLocalStorage } from '@patternfly/quickstarts';
import cookie from 'js-cookie';

import Banner from '../Banners/Banner';
import DefaultLayout from './DefaultLayout';
import NavLoader from '../Sidenav/Navigation/Loader';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';
import { usePendoFeedback } from '../Feedback';

const Navigation = lazy(() => import('../Sidenav/Navigation'));
const LandingNav = lazy(() => import('../Sidenav/LandingNav'));

const loaderWrapper = (Component, props = {}) => (
  <Suspense fallback={<NavLoader />}>
    <Component {...props} />
  </Suspense>
);

const ScalprumRoot = ({ config, ...props }) => {
  const globalFilterRemoved = useSelector(({ globalFilter: { globalFilterRemoved } }) => globalFilterRemoved);
  const [activeQuickStartID, setActiveQuickStartID] = useState(''); // useLocalStorage('insights-quickstartId', '');
  const [allQuickStartStates, setAllQuickStartStates] = useLocalStorage('insights-quickstarts', {});
  const [quickStarts, setQuickStarts] = useState({});
  /**
   * Updates the scalprum context for quick starts
   * @param {string} key App identifier
   * @param {array} qs Array of quick starts
   */
  const updateQuickStarts = (key, qs) => {
    const mergedQuickStarts = {
      ...quickStarts,
      [key]: qs,
    };
    setQuickStarts(mergedQuickStarts);
    // refresh scalprum provider
    const updatedScalprumApi = {
      ...scalprumApi,
    };
    updatedScalprumApi.chrome.quickStarts.get = mergedQuickStarts;
    setScalprumApi(updatedScalprumApi);
  };
  const [scalprumApi, setScalprumApi] = React.useState({
    chrome: {
      experimentalApi: true,
      ...window.insights.chrome,
      usePendoFeedback,
      quickStarts: {
        get: quickStarts,
        set: updateQuickStarts,
        toggle: setActiveQuickStartID,
        Catalog: LazyQuickStartCatalog,
      },
    },
  });

  const combinedQuickStarts = () => {
    const combined = [];
    for (const key in quickStarts) {
      combined.push(...quickStarts[key]);
    }
    return combined;
  };
  const quickStartProps = {
    quickStarts: combinedQuickStarts(),
    activeQuickStartID,
    allQuickStartStates,
    setActiveQuickStartID,
    setAllQuickStartStates,
    showCardFooters: false,
  };

  return (
    /**
     * Once all applications are migrated to chrome 2:
     * - define chrome API in chrome root after it mounts
     * - copy these functions to window
     * - add deprecation warning to the window functions
     */
    <QuickStartContainer {...quickStartProps}>
      <ScalprumProvider config={config} api={scalprumApi}>
        <Switch>
          <Route exact path="/">
            {!cookie.get('cs_jwt') ? <Banner /> : undefined}
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
    </QuickStartContainer>
  );
};

ScalprumRoot.propTypes = {
  config: PropTypes.any,
};

export default ScalprumRoot;

import React, { lazy, Suspense } from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { QuickStartDrawer, QuickStartContext, useValuesForQuickStartContext, useLocalStorage } from '@patternfly/quickstarts';
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
  const [activeQuickStartID, setActiveQuickStartID] = React.useState('');
  const [allQuickStartStates, setAllQuickStartStates] = useLocalStorage('insights-quickstarts', {});
  const valuesForQuickstartContext = useValuesForQuickStartContext({
    activeQuickStartID,
    setActiveQuickStartID,
    allQuickStartStates,
    setAllQuickStartStates,
    footer: {
      show: false,
    },
  });
  return (
    /**
     * Once all applications are migrated to chrome 2:
     * - define chrome API in chrome root after it mounts
     * - copy these functions to window
     * - add deprecation warning to the window functions
     */
    <QuickStartContext.Provider value={valuesForQuickstartContext}>
      <QuickStartDrawer>
        <ScalprumProvider
          config={config}
          api={{
            chrome: {
              experimentalApi: true,
              ...window.insights.chrome,
              usePendoFeedback,
              quickStarts: {
                set: valuesForQuickstartContext.setAllQuickStarts,
                toggle: valuesForQuickstartContext.setActiveQuickStart,
                Catalog: LazyQuickStartCatalog,
              },
            },
          }}
        >
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
      </QuickStartDrawer>
    </QuickStartContext.Provider>
  );
};

ScalprumRoot.propTypes = {
  config: PropTypes.any,
};

export default ScalprumRoot;

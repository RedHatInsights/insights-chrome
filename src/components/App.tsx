import { useEffect } from 'react';
import useSessionConfig from '../hooks/useSessionConfig';
import { ITLess, trustarcScriptSetup } from '../utils/common';
import AppPlaceholder from './AppPlaceholder';
import RootApp from './RootApp';
import registerAnalyticsObserver from '../analytics/analyticsObserver';

const isITLessEnv = ITLess();

const useInitializeAnalytics = () => {
  useEffect(() => {
    // setup trust arc
    trustarcScriptSetup();
    // setup adobe analytics
    if (!isITLessEnv && typeof window._satellite !== 'undefined' && typeof window._satellite.pageBottom === 'function') {
      window._satellite.pageBottom();
      registerAnalyticsObserver();
    }
  }, []);
};

const App = () => {
  const loaded = useSessionConfig();

  useInitializeAnalytics();

  if (!loaded) {
    return <AppPlaceholder />;
  }

  return <RootApp />;
};

export default App;

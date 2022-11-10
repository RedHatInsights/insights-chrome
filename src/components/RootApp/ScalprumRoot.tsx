import React, { Suspense, lazy, useCallback, useContext, useEffect, useState } from 'react';
import { ScalprumProvider, ScalprumProviderProps } from '@scalprum/react-core';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Route, Switch, useHistory } from 'react-router-dom';
import { HelpTopicContext } from '@patternfly/quickstarts';

import DefaultLayout from '../../layouts/DefaultLayout';
import NavLoader from '../Navigation/Loader';
import { usePendoFeedback } from '../Feedback';
import { toggleFeedbackModal } from '../../redux/actions';
import historyListener from '../../utils/historyListener';
import { isFedRamp } from '../../utils/common';
import SegmentContext from '../../analytics/SegmentContext';
import LoadingFallback from '../../utils/loading-fallback';
import { clearAnsibleTrialFlag, isAnsibleTrialFlagActive, setAnsibleTrialFlag } from '../../utils/isAnsibleTrialFlagActive';
import { ReduxState } from '../../redux/store';
import { FlagTagsFilter } from '../GlobalFilter/globalFilterApi';
import { AppsConfig } from '@scalprum/core';
import { HelpTopicsAPI, QuickstartsApi } from '../../@types/types';
import { ChromeAPI } from '@redhat-cloud-services/types';

const Navigation = lazy(() => import('../Navigation'));
const LandingNav = lazy(() => import('../LandingNav'));
const ProductSelection = lazy(() => import('../Stratosphere/ProductSelection'));

const loaderWrapper = (Component: React.ComponentType, props = {}) => (
  <Suspense fallback={<NavLoader />}>
    <Component {...props} />
  </Suspense>
);

const useGlobalFilter = (callback: (selectedTags?: FlagTagsFilter) => any) => {
  const selectedTags = useSelector(({ globalFilter: { selectedTags } }: ReduxState) => selectedTags, shallowEqual);
  return callback(selectedTags);
};

export type ScalprumRootProps = {
  config: AppsConfig;
  helpTopicsAPI: HelpTopicsAPI;
  quickstartsAPI: QuickstartsApi;
};

const ScalprumRoot = ({ config, helpTopicsAPI, quickstartsAPI, ...props }: ScalprumRootProps) => {
  const { setActiveHelpTopicByName, helpTopics, activeHelpTopic, setFilteredHelpTopics } = useContext(HelpTopicContext);
  const { analytics } = useContext(SegmentContext);
  const [activeTopicName, setActiveTopicName] = useState<string | undefined>();
  const [prevActiveTopic, setPrevActiveTopic] = useState<string | undefined>(activeHelpTopic?.name);
  const history = useHistory();
  const globalFilterRemoved = useSelector(({ globalFilter: { globalFilterRemoved } }: ReduxState) => globalFilterRemoved);
  const dispatch = useDispatch();

  async function setActiveTopic(name: string) {
    setActiveTopicName(name);
    if (name?.length > 0) {
      helpTopicsAPI.enableTopics(name);
    }
  }

  async function enableTopics(...names: string[]) {
    return helpTopicsAPI.enableTopics(...names).then((res) => {
      setFilteredHelpTopics?.(res);
      return res;
    });
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
      setPrevActiveTopic(undefined);
    } else {
      if (typeof activeTopicName === 'string' && activeTopicName?.length > 0) {
        if (helpTopics?.find(({ name }) => name === activeTopicName)) {
          setActiveHelpTopicByName && setActiveHelpTopicByName(activeTopicName);
          setPrevActiveTopic(activeTopicName);
        }
      } else {
        setActiveHelpTopicByName && setActiveHelpTopicByName('');
        setPrevActiveTopic(undefined);
      }
    }
  }, [activeTopicName, helpTopics, activeHelpTopic]);

  const setPageMetadata = useCallback((pageOptions) => {
    window._segment = {
      ...window._segment,
      pageOptions,
    };
  }, []);

  const scalprumProviderProps: ScalprumProviderProps<{ chrome: ChromeAPI }> = {
    config,
    api: {
      chrome: {
        ...window.insights.chrome,
        experimentalApi: true,
        isFedramp: isFedRamp(),
        usePendoFeedback,
        segment: {
          setPageMetadata,
        },
        toggleFeedbackModal: (...args) => dispatch(toggleFeedbackModal(...args)),
        // FIXME: Update types once merged
        quickStarts: quickstartsAPI as unknown as ChromeAPI['quickStarts'],
        helpTopics: {
          ...helpTopicsAPI,
          setActiveTopic,
          enableTopics,
          closeHelpTopic: () => {
            setActiveTopic('');
          },
        },
        clearAnsibleTrialFlag,
        isAnsibleTrialFlagActive,
        setAnsibleTrialFlag,
        chromeHistory: history,
        analytics: analytics!,
        // FIXME: Update types once merged
        useGlobalFilter: useGlobalFilter as unknown as ChromeAPI['useGlobalFilter'],
      },
    },
  };

  return (
    /**
     * Once all applications are migrated to chrome 2:
     * - define chrome API in chrome root after it mounts
     * - copy these functions to window
     * - add deprecation warning to the window functions
     */
    <ScalprumProvider {...scalprumProviderProps}>
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

export default ScalprumRoot;

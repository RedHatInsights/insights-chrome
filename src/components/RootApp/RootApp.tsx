import React, { Suspense, lazy, memo, useContext, useEffect } from 'react';
import { unstable_HistoryRouter as HistoryRouter, HistoryRouterProps } from 'react-router-dom';
import { HelpTopicContainer, QuickStart, QuickStartContainer, QuickStartContainerProps } from '@patternfly/quickstarts';
import { useAtomValue } from 'jotai';
import chromeHistory from '../../utils/chromeHistory';
import { FeatureFlagsProvider } from '../FeatureFlags';
import ScalprumRoot from './ScalprumRoot';
import { useDispatch, useSelector } from 'react-redux';
import { addQuickstart as addQuickstartAction, clearQuickstarts, populateQuickstartsCatalog } from '../../redux/actions';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';
import useQuickstartsStates from '../QuickStart/useQuickstartsStates';
import useHelpTopicState from '../QuickStart/useHelpTopicState';
import validateQuickstart from '../QuickStart/quickstartValidation';
import SegmentProvider from '../../analytics/SegmentProvider';
import { ReduxState } from '../../redux/store';
import { ITLess, chunkLoadErrorRefreshKey, getRouterBasename } from '../../utils/common';
import useUserSSOScopes from '../../hooks/useUserSSOScopes';
import { DeepRequired } from 'utility-types';
import ReactDOM from 'react-dom';
import { FooterProps } from '../Footer/Footer';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { scalprumConfigAtom } from '../../state/atoms/scalprumConfigAtom';

const NotEntitledModal = lazy(() => import('../NotEntitledModal'));
const Debugger = lazy(() => import('../Debugger'));

export type RootAppProps = FooterProps;

const RootApp = memo((props: RootAppProps) => {
  const config = useAtomValue(scalprumConfigAtom);
  const { activateQuickstart, allQuickStartStates, setAllQuickStartStates, activeQuickStartID, setActiveQuickStartID } = useQuickstartsStates();
  const { helpTopics, addHelpTopics, disableTopics, enableTopics } = useHelpTopicState();
  const dispatch = useDispatch();
  const activeModule = useAtomValue(activeModuleAtom);
  const quickStarts = useSelector(
    ({
      chrome: {
        quickstarts: { quickstarts },
      },
    }: ReduxState) => Object.values(quickstarts).flat()
  );
  const { user } = useContext(ChromeAuthContext) as DeepRequired<ChromeAuthContextValue>;
  const isDebuggerEnabled = useSelector<ReduxState, boolean | undefined>(({ chrome: { isDebuggerEnabled } }) => isDebuggerEnabled);

  // verify use loged in scopes
  useUserSSOScopes();

  useEffect(() => {
    dispatch(clearQuickstarts(activeQuickStartID));
    if (activeModule) {
      let timeout: NodeJS.Timeout;
      const moduleStorageKey = `${chunkLoadErrorRefreshKey}-${activeModule}`;
      if (localStorage.getItem(moduleStorageKey) === 'true') {
        // The localStorage should either be true or null. A false value
        // can cause infinite loops. The timeout will remove the value after
        // ten seconds
        timeout = setTimeout(() => {
          localStorage.removeItem(moduleStorageKey);
        }, 10_000);
      }
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
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
    return validateQuickstart(key, qs) ? !!dispatch(addQuickstartAction(key, qs)) : false;
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
    activateQuickstart,
    add: addQuickstart,
    toggle: setActiveQuickStartID,
    Catalog: LazyQuickStartCatalog,
    updateQuickStarts,
  };
  return (
    <HistoryRouter history={chromeHistory as unknown as HistoryRouterProps['history']} basename={getRouterBasename()}>
      <SegmentProvider>
        <FeatureFlagsProvider>
          {/* <CrossRequestNotifier /> */}
          <Suspense fallback={null}>
            <NotEntitledModal />
          </Suspense>
          <Suspense fallback={null}>
            {user?.identity?.account_number && !ITLess() && isDebuggerEnabled && ReactDOM.createPortal(<Debugger user={user} />, document.body)}
          </Suspense>
          <QuickStartContainer {...quickStartProps}>
            <HelpTopicContainer helpTopics={helpTopics}>
              <ScalprumRoot {...props} config={config} quickstartsAPI={quickstartsAPI} helpTopicsAPI={helpTopicsAPI} />
            </HelpTopicContainer>
          </QuickStartContainer>
        </FeatureFlagsProvider>
      </SegmentProvider>
    </HistoryRouter>
  );
});

RootApp.displayName = 'MemoizedRootApp';

export default RootApp;

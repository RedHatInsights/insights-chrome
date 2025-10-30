import React, { Suspense, lazy, memo, useContext, useEffect, useMemo } from 'react';
import { unstable_HistoryRouter as HistoryRouter, HistoryRouterProps } from 'react-router-dom';
import { HelpTopicContainer, QuickStart, QuickStartContainer, QuickStartContainerProps } from '@patternfly/quickstarts';
import { useAtomValue, useSetAtom } from 'jotai';
import chromeHistory from '../../utils/chromeHistory';
import { FeatureFlagsProvider } from '../FeatureFlags';
import ScalprumRoot from './ScalprumRoot';
import { LazyQuickStartCatalog } from '../QuickStart/LazyQuickStartCatalog';
import useQuickstartsStates from '../QuickStart/useQuickstartsStates';
import useHelpTopicState from '../QuickStart/useHelpTopicState';
import validateQuickstart from '../QuickStart/quickstartValidation';
import SegmentProvider from '../../analytics/SegmentProvider';
import { ITLess, chunkLoadErrorRefreshKey } from '../../utils/common';
import useUserSSOScopes from '../../hooks/useUserSSOScopes';
import { DeepRequired } from 'utility-types';
import ReactDOM from 'react-dom';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { scalprumConfigAtom } from '../../state/atoms/scalprumConfigAtom';
import { isDebuggerEnabledAtom } from '../../state/atoms/debuggerModalatom';
import { addQuickstartToAppAtom, clearQuickstartsAtom, populateQuickstartsAppAtom, quickstartsAtom } from '../../state/atoms/quickstartsAtom';
import useQuickstartLinkStore, { createQuickstartLinkMarkupExtension } from '../../hooks/useQuickstarLinksStore';

const NotEntitledModal = lazy(() => import('../NotEntitledModal'));
const Debugger = lazy(() => import('../Debugger'));

const RootApp = memo(({ accountId }: { accountId?: string }) => {
  const quickstartLinkStore = useQuickstartLinkStore();
  const config = useAtomValue(scalprumConfigAtom);
  const { activateQuickstart, allQuickStartStates, setAllQuickStartStates, activeQuickStartID, setActiveQuickStartID } = useQuickstartsStates(accountId);
  const { helpTopics, addHelpTopics, disableTopics, enableTopics } = useHelpTopicState();
  const activeModule = useAtomValue(activeModuleAtom);
  const quickstartsData = useAtomValue(quickstartsAtom);
  const quickStarts = useMemo(() => Object.values(quickstartsData).flat(), [quickstartsData]);
  const clearQuickstarts = useSetAtom(clearQuickstartsAtom);
  const populateQuickstarts = useSetAtom(populateQuickstartsAppAtom);
  const addQuickstartToApp = useSetAtom(addQuickstartToAppAtom);

  useEffect(() => {
    clearQuickstarts(activeQuickStartID);
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
    populateQuickstarts({ app: key, quickstarts: qs });
  };

  const addQuickstart = (key: string, qs: QuickStart): boolean => {
    if (validateQuickstart(key, qs)) {
      addQuickstartToApp({ app: key, quickstart: qs });
      return true;
    }
    return false;
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
    markdown: {
      extensions: [createQuickstartLinkMarkupExtension(quickstartLinkStore)],
    },
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
    <HistoryRouter history={chromeHistory as unknown as HistoryRouterProps['history']}>
      <SegmentProvider>
        <FeatureFlagsProvider>
          {/* <CrossRequestNotifier /> */}
          <Suspense fallback={null}>
            <NotEntitledModal />
          </Suspense>
          <Suspense fallback={null}></Suspense>
          <QuickStartContainer {...quickStartProps}>
            <HelpTopicContainer helpTopics={helpTopics}>
              <ScalprumRoot config={config} quickstartsAPI={quickstartsAPI} helpTopicsAPI={helpTopicsAPI} />
            </HelpTopicContainer>
          </QuickStartContainer>
        </FeatureFlagsProvider>
      </SegmentProvider>
    </HistoryRouter>
  );
});

RootApp.displayName = 'MemoizedRootApp';

const AuthRoot = () => {
  const { user, login } = useContext(ChromeAuthContext) as DeepRequired<ChromeAuthContextValue>;
  const isDebuggerEnabled = useAtomValue(isDebuggerEnabledAtom);

  // verify use loged in scopes
  useUserSSOScopes(login);
  return (
    <>
      <Suspense fallback={null}>
        {user?.identity?.account_number && !ITLess() && isDebuggerEnabled && ReactDOM.createPortal(<Debugger user={user} />, document.body)}
      </Suspense>
      <RootApp accountId={user?.identity?.internal?.account_id} />
    </>
  );
};

export default AuthRoot;

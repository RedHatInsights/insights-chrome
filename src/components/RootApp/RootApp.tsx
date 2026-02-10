import React, { Suspense, lazy, memo, useContext } from 'react';
import { unstable_HistoryRouter as HistoryRouter, HistoryRouterProps } from 'react-router-dom';
import { HelpTopicContainer } from '@patternfly/quickstarts';
import { useAtomValue } from 'jotai';
import chromeHistory from '../../utils/chromeHistory';
import { FeatureFlagsProvider } from '../FeatureFlags';
import ScalprumRoot from './ScalprumRoot';
import useHelpTopicState from '../QuickStart/useHelpTopicState';
import SegmentProvider from '../../analytics/SegmentProvider';
import { ITLess } from '../../utils/common';
import useUserSSOScopes from '../../hooks/useUserSSOScopes';
import { DeepRequired } from 'utility-types';
import ReactDOM from 'react-dom';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import { scalprumConfigAtom } from '../../state/atoms/scalprumConfigAtom';
import { isDebuggerEnabledAtom } from '../../state/atoms/debuggerModalatom';

const NotEntitledModal = lazy(() => import('../NotEntitledModal'));
const Debugger = lazy(() => import('../Debugger'));

const RootApp = memo(({ accountId }: { accountId?: string }) => {
  const config = useAtomValue(scalprumConfigAtom);
  const { helpTopics, addHelpTopics, disableTopics, enableTopics } = useHelpTopicState();

  const helpTopicsAPI = {
    addHelpTopics,
    disableTopics,
    enableTopics,
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
          <HelpTopicContainer helpTopics={helpTopics}>
            <ScalprumRoot config={config} helpTopicsAPI={helpTopicsAPI} accountId={accountId} />
          </HelpTopicContainer>
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

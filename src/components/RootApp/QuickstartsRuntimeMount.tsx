import React, { Component, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';
import { ScalprumComponent } from '@scalprum/react-core';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChromeAPI } from '@redhat-cloud-services/types';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import chromeStore from '../../state/chromeStore';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { setServiceDegradedAtom } from '../../state/atoms/degradedStateAtom';
import { LiveQuickstartsAPI, liveHelpTopicsAPIRef, liveQuickstartsAPIRef, remoteActiveQuickStartIDAtom } from '../../state/atoms/remoteQuickstartsAtom';
import LegacyQuickstartsRuntime from './LegacyQuickstartsRuntime';
import { useLearningResourcesQuickstarts } from './useLearningResourcesQuickstarts';

export {
  LEARNING_RESOURCES_QUICKSTARTS_FLAG,
  LEARNING_RESOURCES_QUICKSTARTS_STORAGE_KEY,
  useLearningResourcesQuickstarts,
} from './useLearningResourcesQuickstarts';
export const REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS = 5000;

function setQuickstartsDegraded(degraded: boolean) {
  chromeStore.set(setServiceDegradedAtom, { service: 'quickstarts', degraded });
}

class QuickstartsRuntimeBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('Quickstarts runtime failed:', error);
    setQuickstartsDegraded(true);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const QuickstartsRemoteError = ({ children }: { children?: ReactNode; error?: unknown }) => {
  const setServiceDegraded = useSetAtom(setServiceDegradedAtom);
  useEffect(() => {
    setServiceDegraded({ service: 'quickstarts', degraded: true });
    return () => {
      setServiceDegraded({ service: 'quickstarts', degraded: false });
    };
  }, [setServiceDegraded]);
  return <>{children}</>;
};

const QuickstartsRuntimeMount = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(ChromeAuthContext);
  const activeModule = useAtomValue(activeModuleAtom);
  const setRemoteActiveQSID = useSetAtom(remoteActiveQuickStartIDAtom);
  const setServiceDegraded = useSetAtom(setServiceDegradedAtom);
  const useRemote = useLearningResourcesQuickstarts();
  const apiReadyRef = useRef(false);

  const handleApiReady = useCallback(
    (api: { quickstartsAPI: LiveQuickstartsAPI; helpTopicsAPI: ChromeAPI['helpTopics'] }) => {
      apiReadyRef.current = true;
      liveQuickstartsAPIRef.current = api.quickstartsAPI;
      liveHelpTopicsAPIRef.current = api.helpTopicsAPI;
      setServiceDegraded({ service: 'quickstarts', degraded: false });
    },
    [setServiceDegraded]
  );

  const handleActiveQSChanged = useCallback(
    (id: string) => {
      setRemoteActiveQSID(id);
    },
    [setRemoteActiveQSID]
  );

  useEffect(() => {
    if (!useRemote) {
      return;
    }
    apiReadyRef.current = false;
    const timeout = window.setTimeout(() => {
      if (!apiReadyRef.current) {
        setServiceDegraded({ service: 'quickstarts', degraded: true });
      }
    }, REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [useRemote, setServiceDegraded]);

  const accountId = user?.identity?.internal?.account_id;

  if (!useRemote) {
    return (
      <LegacyQuickstartsRuntime accountId={accountId} activeModule={activeModule} onApiReady={handleApiReady} onActiveQuickStartChanged={handleActiveQSChanged}>
        {children}
      </LegacyQuickstartsRuntime>
    );
  }

  return (
    <QuickstartsRuntimeBoundary fallback={children}>
      <ScalprumComponent
        scope="learningResources"
        module="./QuickstartsRuntime"
        ErrorComponent={<QuickstartsRemoteError>{children}</QuickstartsRemoteError>}
        fallback={children}
        accountId={accountId}
        activeModule={activeModule}
        onApiReady={handleApiReady}
        onActiveQuickStartChanged={handleActiveQSChanged}
      >
        {children}
      </ScalprumComponent>
    </QuickstartsRuntimeBoundary>
  );
};

export default QuickstartsRuntimeMount;

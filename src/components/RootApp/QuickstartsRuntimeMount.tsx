import React, { Component, ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ScalprumComponent } from '@scalprum/react-core';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChromeAPI } from '@redhat-cloud-services/types';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import chromeStore from '../../state/chromeStore';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { setServiceDegradedAtom } from '../../state/atoms/degradedStateAtom';
import { LiveQuickstartsAPI, remoteActiveQuickStartIDAtom } from '../../state/atoms/remoteQuickstartsAtom';
import { dropPendingLiveChromeQuickstartsApis, publishLiveChromeQuickstartsApis } from '../../state/atoms/delegatedChromeQuickstarts';
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

function clearRemoteActiveQuickStartID(setRemoteActiveQSID?: (id: string) => void) {
  chromeStore.set(remoteActiveQuickStartIDAtom, '');
  setRemoteActiveQSID?.('');
}

function failQuickstartsRuntime(
  setRemoteActiveQSID?: (id: string) => void,
  setServiceDegraded?: (update: { service: 'quickstarts'; degraded: boolean }) => void
) {
  setQuickstartsDegraded(true);
  setServiceDegraded?.({ service: 'quickstarts', degraded: true });
  clearRemoteActiveQuickStartID(setRemoteActiveQSID);
  dropPendingLiveChromeQuickstartsApis();
}

class QuickstartsRuntimeBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('Quickstarts runtime failed:', error);
    failQuickstartsRuntime();
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const QuickstartsRemoteError = () => {
  const setServiceDegraded = useSetAtom(setServiceDegradedAtom);
  const setRemoteActiveQSID = useSetAtom(remoteActiveQuickStartIDAtom);
  useEffect(() => {
    failQuickstartsRuntime(setRemoteActiveQSID, setServiceDegraded);
    return () => {
      setServiceDegraded({ service: 'quickstarts', degraded: false });
    };
  }, [setRemoteActiveQSID, setServiceDegraded]);
  return null;
};

const REMOTE_CHILDREN_SLOT_STYLE: React.CSSProperties = { display: 'contents' };

/**
 * Keep the console tree in one React position. Move only the DOM node into the
 * remote drawer slot (or a fallback host while the remote is loading / failed).
 * Merged LR already wraps `{children}` in the PF drawers, so Chrome passes a
 * tiny placeholder as the remote's children and portals the console into it.
 */
const ChromeChildrenPortal = ({ children, slot }: { children: ReactNode; slot: HTMLElement | null }) => {
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const portalNodeRef = useRef<HTMLDivElement | null>(null);

  if (!portalNodeRef.current && typeof document !== 'undefined') {
    const node = document.createElement('div');
    node.setAttribute('data-ouia-component-id', 'chrome-quickstarts-children');
    node.style.display = 'contents';
    portalNodeRef.current = node;
  }

  const portalNode = portalNodeRef.current;

  /**
   * Attach on ref commit rather than in a layout effect. A parent layout effect
   * runs *after* the portal children's own layout effects, which would leave the
   * whole console tree measuring a detached node on first mount. The fallback
   * host's ref commits before the portal sibling, so children mount attached.
   */
  const attachFallbackHost = useCallback(
    (node: HTMLDivElement | null) => {
      fallbackRef.current = node;
      if (node && portalNode && !portalNode.parentElement) {
        node.appendChild(portalNode);
      }
    },
    [portalNode]
  );

  useLayoutEffect(() => {
    if (!portalNode) {
      return;
    }
    const host = slot ?? fallbackRef.current;
    if (host && portalNode.parentElement !== host) {
      host.appendChild(portalNode);
    }
  }, [slot, portalNode]);

  useLayoutEffect(() => {
    return () => {
      portalNode?.remove();
    };
  }, [portalNode]);

  if (!portalNode) {
    return <>{children}</>;
  }

  return (
    <>
      <div ref={attachFallbackHost} style={{ display: 'contents' }} />
      {createPortal(children, portalNode)}
    </>
  );
};

const QuickstartsRuntimeMount = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(ChromeAuthContext);
  const activeModule = useAtomValue(activeModuleAtom);
  const setRemoteActiveQSID = useSetAtom(remoteActiveQuickStartIDAtom);
  const setServiceDegraded = useSetAtom(setServiceDegradedAtom);
  const useRemote = useLearningResourcesQuickstarts();
  const apiReadyRef = useRef(false);
  const [childrenSlotEl, setChildrenSlotEl] = useState<HTMLDivElement | null>(null);
  const setRemoteChildrenSlot = useCallback((node: HTMLDivElement | null) => {
    setChildrenSlotEl(node);
  }, []);

  const handleApiReady = useCallback(
    (api: { quickstartsAPI: LiveQuickstartsAPI; helpTopicsAPI: ChromeAPI['helpTopics'] }) => {
      apiReadyRef.current = true;
      publishLiveChromeQuickstartsApis(api);
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
      setChildrenSlotEl(null);
      return;
    }
    apiReadyRef.current = false;
    const timeout = window.setTimeout(() => {
      if (!apiReadyRef.current) {
        failQuickstartsRuntime(setRemoteActiveQSID, setServiceDegraded);
      }
    }, REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [useRemote, setRemoteActiveQSID, setServiceDegraded]);

  const accountId = user?.identity?.internal?.account_id;

  if (!useRemote) {
    return (
      <LegacyQuickstartsRuntime accountId={accountId} activeModule={activeModule} onApiReady={handleApiReady} onActiveQuickStartChanged={handleActiveQSChanged}>
        {children}
      </LegacyQuickstartsRuntime>
    );
  }

  return (
    <>
      <ChromeChildrenPortal slot={childrenSlotEl}>{children}</ChromeChildrenPortal>
      <QuickstartsRuntimeBoundary fallback={null}>
        <ScalprumComponent
          scope="learningResources"
          module="./QuickstartsRuntime"
          ErrorComponent={<QuickstartsRemoteError />}
          fallback={null}
          accountId={accountId}
          activeModule={activeModule}
          onApiReady={handleApiReady}
          onActiveQuickStartChanged={handleActiveQSChanged}
        >
          <div ref={setRemoteChildrenSlot} data-ouia-component-id="chrome-quickstarts-slot" style={REMOTE_CHILDREN_SLOT_STYLE} />
        </ScalprumComponent>
      </QuickstartsRuntimeBoundary>
    </>
  );
};

export default QuickstartsRuntimeMount;

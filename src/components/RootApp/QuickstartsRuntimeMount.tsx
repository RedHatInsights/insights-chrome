import React, { Component, ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ScalprumComponent } from '@scalprum/react-core';
import { HelpTopicContext, HelpTopicContextDefaults, QuickStartContext, QuickStartContextDefaults } from '@patternfly/quickstarts';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChromeAPI } from '@redhat-cloud-services/types';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import chromeStore from '../../state/chromeStore';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { setServiceDegradedAtom } from '../../state/atoms/degradedStateAtom';
import { LiveQuickstartsAPI, remoteActiveQuickStartIDAtom } from '../../state/atoms/remoteQuickstartsAtom';
import {
  clearRegisteredChromeQuickstarts,
  dropPendingLiveChromeQuickstartsApis,
  publishLiveChromeQuickstartsApis,
  retireLiveChromeQuickstartsApis,
} from '../../state/atoms/delegatedChromeQuickstarts';
import { quickstartsRuntimeContextAtom } from '../../state/atoms/quickstartsRuntimeContextAtom';
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

const RUNTIME_CHILDREN_SLOT_STYLE: React.CSSProperties = { display: 'contents' };

type MoveBeforeHost = HTMLElement & { moveBefore?: (node: Node, child: Node | null) => void };

type TextSelection = { start: number | null; end: number | null; direction: 'forward' | 'backward' | 'none' | null };
type RangeSnapshot = { startContainer: Node; startOffset: number; endContainer: Node; endOffset: number };

function readTextSelection(element: HTMLElement): TextSelection | null {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    return null;
  }
  try {
    return { start: element.selectionStart, end: element.selectionEnd, direction: element.selectionDirection };
  } catch {
    // Input types without a text selection (number, email in some browsers) throw.
    return null;
  }
}

function readRanges(node: HTMLElement): RangeSnapshot[] {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.anchorNode || !node.contains(selection.anchorNode)) {
    return [];
  }
  return Array.from({ length: selection.rangeCount }, (_, index) => {
    const range = selection.getRangeAt(index);
    return { startContainer: range.startContainer, startOffset: range.startOffset, endContainer: range.endContainer, endOffset: range.endOffset };
  });
}

/** Scroll offsets are reset when an element leaves the document. */
function readScrollOffsets(node: HTMLElement) {
  const offsets: [Element, number, number][] = [];
  node.querySelectorAll('*').forEach((element) => {
    if (element.scrollTop !== 0 || element.scrollLeft !== 0) {
      offsets.push([element, element.scrollTop, element.scrollLeft]);
    }
  });
  return offsets;
}

/**
 * Move the console node into `host` without losing the user's place. `moveBefore`
 * is an atomic move that keeps focus, selection and scroll and fires no blur.
 * Elsewhere `appendChild` removes the subtree first, which drops focus to
 * `document.body`, so capture focus, selection and scroll offsets and restore them.
 */
function moveConsoleNode(host: HTMLElement, node: HTMLElement) {
  const moveHost = host as MoveBeforeHost;
  if (typeof moveHost.moveBefore === 'function' && host.isConnected && node.isConnected) {
    try {
      moveHost.moveBefore(node, null);
      return;
    } catch {
      // Not movable atomically (e.g. across documents); fall back below.
    }
  }

  const active = node.isConnected ? document.activeElement : null;
  const focused = active instanceof HTMLElement && node.contains(active) ? active : null;
  const textSelection = focused && readTextSelection(focused);
  const ranges = node.isConnected ? readRanges(node) : [];
  const scrollOffsets = node.isConnected ? readScrollOffsets(node) : [];

  host.appendChild(node);

  scrollOffsets.forEach(([element, top, left]) => {
    element.scrollTop = top;
    element.scrollLeft = left;
  });
  if (focused && focused.isConnected && document.activeElement !== focused) {
    focused.focus({ preventScroll: true });
    if (textSelection && textSelection.start !== null && textSelection.end !== null) {
      try {
        (focused as HTMLInputElement | HTMLTextAreaElement).setSelectionRange(textSelection.start, textSelection.end, textSelection.direction ?? undefined);
      } catch {
        // Selection not supported for this input type.
      }
    }
  }
  if (ranges.length > 0 && !textSelection) {
    const selection = document.getSelection();
    selection?.removeAllRanges();
    ranges.forEach((snapshot) => {
      try {
        const range = document.createRange();
        range.setStart(snapshot.startContainer, snapshot.startOffset);
        range.setEnd(snapshot.endContainer, snapshot.endOffset);
        selection?.addRange(range);
      } catch {
        // The selected nodes changed during the move.
      }
    });
  }
}

/**
 * Keep the console tree in one React position. Move only the DOM node into the
 * active runtime's drawer slot (or a fallback host while the remote is loading /
 * failed). Both runtimes wrap `{children}` in the PF drawers, so Chrome passes a
 * tiny placeholder as the runtime's children and portals the console into it.
 */
type ConsoleHostController = { releaseSlot: () => void };

const ChromeChildrenPortal = ({
  children,
  slot,
  controllerRef,
}: {
  children: ReactNode;
  slot: HTMLElement | null;
  controllerRef: React.MutableRefObject<ConsoleHostController | null>;
}) => {
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
      moveConsoleNode(host, portalNode);
    }
  }, [slot, portalNode]);

  /**
   * The runtime's slot is about to be removed with the outgoing runtime (swap or
   * failure). Called from the slot's ref detach, which React runs before it removes
   * the runtime's DOM, so the console leaves the slot while still attached and
   * keeps focus instead of being removed along with it.
   */
  useLayoutEffect(() => {
    controllerRef.current = {
      releaseSlot: () => {
        const fallback = fallbackRef.current;
        if (portalNode && fallback?.isConnected && portalNode.parentElement !== fallback) {
          moveConsoleNode(fallback, portalNode);
        }
      },
    };
    return () => {
      controllerRef.current = null;
    };
  }, [controllerRef, portalNode]);

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

/**
 * Rendered inside the active runtime's children, so it sits under the runtime's
 * QuickStart/HelpTopic providers. `@patternfly/quickstarts` is a shared singleton,
 * so these are the same context objects Chrome uses. Copies the runtime values
 * out for `RuntimeContextBridge`. Unmounting (remote failed / swapped) clears them.
 */
const RuntimeContextReporter = () => {
  const quickStart = useContext(QuickStartContext);
  const helpTopic = useContext(HelpTopicContext);
  const setRuntimeContext = useSetAtom(quickstartsRuntimeContextAtom);

  useLayoutEffect(() => {
    setRuntimeContext({ quickStart, helpTopic });
  }, [quickStart, helpTopic, setRuntimeContext]);

  useLayoutEffect(() => {
    return () => {
      setRuntimeContext(null);
    };
  }, [setRuntimeContext]);

  return null;
};

/**
 * React context follows the React tree, not the DOM. The portalled console is a
 * React sibling of the runtime, so re-provide the runtime's context values here.
 * Providers are always rendered (defaults until the runtime reports) so the tree
 * shape never changes and the console is never remounted. Only this component
 * subscribes to the atom, so updates never re-render the remote.
 */
const RuntimeContextBridge = ({ children }: { children: ReactNode }) => {
  const runtimeContext = useAtomValue(quickstartsRuntimeContextAtom);
  return (
    <QuickStartContext.Provider value={runtimeContext?.quickStart ?? QuickStartContextDefaults}>
      <HelpTopicContext.Provider value={runtimeContext?.helpTopic ?? HelpTopicContextDefaults}>{children}</HelpTopicContext.Provider>
    </QuickStartContext.Provider>
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
  const consoleHostRef = useRef<ConsoleHostController | null>(null);
  const setRuntimeChildrenSlot = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      consoleHostRef.current?.releaseSlot();
    }
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

  /**
   * Swapping runtimes: detach the outgoing one so delegate calls queue for its
   * replacement. Layout cleanup so the outgoing runtime is detached before any
   * effect of the incoming one (layout or passive) can publish its API.
   * Reset readiness here as well: an incoming child's passive effect can publish
   * before the parent's timeout effect runs.
   */
  useLayoutEffect(() => {
    return () => {
      apiReadyRef.current = false;
      retireLiveChromeQuickstartsApis();
    };
  }, [useRemote]);

  useEffect(() => {
    clearRegisteredChromeQuickstarts();
  }, [activeModule]);

  useEffect(() => {
    if (!useRemote) {
      return;
    }
    const timeout = window.setTimeout(() => {
      if (!apiReadyRef.current) {
        failQuickstartsRuntime(setRemoteActiveQSID, setServiceDegraded);
      }
    }, REMOTE_QUICKSTARTS_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [useRemote, setRemoteActiveQSID, setServiceDegraded]);

  const accountId = user?.identity?.internal?.account_id;

  // Same slot for both runtimes, so a flag change swaps only the runtime sibling
  // and never remounts the console.
  const runtimeSlot = (
    <div ref={setRuntimeChildrenSlot} data-ouia-component-id="chrome-quickstarts-slot" style={RUNTIME_CHILDREN_SLOT_STYLE}>
      <RuntimeContextReporter />
    </div>
  );

  return (
    <>
      <ChromeChildrenPortal slot={childrenSlotEl} controllerRef={consoleHostRef}>
        <RuntimeContextBridge>{children}</RuntimeContextBridge>
      </ChromeChildrenPortal>
      {useRemote ? (
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
            {runtimeSlot}
          </ScalprumComponent>
        </QuickstartsRuntimeBoundary>
      ) : (
        <LegacyQuickstartsRuntime
          accountId={accountId}
          activeModule={activeModule}
          onApiReady={handleApiReady}
          onActiveQuickStartChanged={handleActiveQSChanged}
        >
          {runtimeSlot}
        </LegacyQuickstartsRuntime>
      )}
    </>
  );
};

export default QuickstartsRuntimeMount;

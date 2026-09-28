import React from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { LiveQuickstartsAPI, liveHelpTopicsAPIRef, liveQuickstartsAPIRef } from './remoteQuickstartsAtom';

type PendingCall<T> = {
  run: (api: T) => void;
  abort: () => void;
};

let liveRuntimeUnavailable = false;
const pendingQuickstartsCalls: PendingCall<LiveQuickstartsAPI>[] = [];
const pendingHelpTopicsCalls: PendingCall<ChromeAPI['helpTopics']>[] = [];

function flushPending<T>(queue: PendingCall<T>[], api: T | null) {
  const pending = queue.splice(0);
  if (!api) {
    pending.forEach((item) => item.abort());
    return;
  }
  pending.forEach((item) => item.run(api));
}

function enqueueOrRun<T>(api: T | null, queue: PendingCall<T>[], run: (api: T) => void, abort: () => void) {
  if (api) {
    run(api);
    return;
  }
  if (liveRuntimeUnavailable) {
    abort();
    return;
  }
  queue.push({ run, abort });
}

/**
 * Wire the live runtime into the Chrome delegates and replay anything that arrived
 * before `onApiReady` (tenant `useChrome()` calls during Scalprum load).
 */
export function publishLiveChromeQuickstartsApis(api: { quickstartsAPI: LiveQuickstartsAPI; helpTopicsAPI: ChromeAPI['helpTopics'] }) {
  liveRuntimeUnavailable = false;
  liveQuickstartsAPIRef.current = api.quickstartsAPI;
  liveHelpTopicsAPIRef.current = api.helpTopicsAPI;
  flushPending(pendingQuickstartsCalls, api.quickstartsAPI);
  flushPending(pendingHelpTopicsCalls, api.helpTopicsAPI);
}

/**
 * Remote load failed or timed out. Drop queued calls so promises do not hang.
 * Do not fall back to leftover Chrome here — flag-on isolation stays in place.
 */
export function dropPendingLiveChromeQuickstartsApis() {
  liveRuntimeUnavailable = true;
  liveQuickstartsAPIRef.current = null;
  liveHelpTopicsAPIRef.current = null;
  flushPending(pendingQuickstartsCalls, null);
  flushPending(pendingHelpTopicsCalls, null);
}

/** Test helper: empty queues and treat the runtime as not-yet-loaded (not failed). */
export function resetDelegatedChromeQuickstartsState() {
  liveRuntimeUnavailable = false;
  liveQuickstartsAPIRef.current = null;
  liveHelpTopicsAPIRef.current = null;
  pendingQuickstartsCalls.splice(0).forEach((item) => item.abort());
  pendingHelpTopicsCalls.splice(0).forEach((item) => item.abort());
}

export const delegatedQuickstartsAPI: LiveQuickstartsAPI = {
  version: 1,
  set: (...args: Parameters<ChromeAPI['quickStarts']['set']>) => {
    enqueueOrRun(
      liveQuickstartsAPIRef.current,
      pendingQuickstartsCalls,
      (api) => api.set(...args),
      () => undefined
    );
  },
  activateQuickstart: (name: string) => {
    const api = liveQuickstartsAPIRef.current;
    if (api) {
      return api.activateQuickstart(name);
    }
    if (liveRuntimeUnavailable) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      pendingQuickstartsCalls.push({
        run: (live) => {
          live.activateQuickstart(name).then(resolve).catch(reject);
        },
        abort: () => resolve(),
      });
    });
  },
  toggle: (...args: Parameters<ChromeAPI['quickStarts']['toggle']>) => {
    enqueueOrRun(
      liveQuickstartsAPIRef.current,
      pendingQuickstartsCalls,
      (api) => api.toggle(...args),
      () => undefined
    );
  },
  Catalog: ((props: Record<string, unknown>) => {
    const Catalog = liveQuickstartsAPIRef.current?.Catalog;
    return Catalog ? React.createElement(Catalog, props) : null;
  }) as ChromeAPI['quickStarts']['Catalog'],
  updateQuickStarts: (key: string, quickstarts: QuickStart[]) => {
    enqueueOrRun(
      liveQuickstartsAPIRef.current,
      pendingQuickstartsCalls,
      (api) => api.updateQuickStarts?.(key, quickstarts),
      () => undefined
    );
  },
  add: (key: string, qs: QuickStart) => {
    const api = liveQuickstartsAPIRef.current;
    if (api) {
      return api.add?.(key, qs) ?? false;
    }
    if (liveRuntimeUnavailable) {
      return false;
    }
    pendingQuickstartsCalls.push({
      run: (live) => {
        live.add?.(key, qs);
      },
      abort: () => undefined,
    });
    return true;
  },
};

export const delegatedHelpTopicsAPI: ChromeAPI['helpTopics'] = {
  addHelpTopics: (...args: Parameters<ChromeAPI['helpTopics']['addHelpTopics']>) => {
    enqueueOrRun(
      liveHelpTopicsAPIRef.current,
      pendingHelpTopicsCalls,
      (api) => api.addHelpTopics(...args),
      () => undefined
    );
  },
  disableTopics: (...args: Parameters<ChromeAPI['helpTopics']['disableTopics']>) => {
    enqueueOrRun(
      liveHelpTopicsAPIRef.current,
      pendingHelpTopicsCalls,
      (api) => api.disableTopics(...args),
      () => undefined
    );
  },
  enableTopics: (...args: Parameters<ChromeAPI['helpTopics']['enableTopics']>) => {
    const api = liveHelpTopicsAPIRef.current;
    if (api) {
      return api.enableTopics(...args);
    }
    if (liveRuntimeUnavailable) {
      return Promise.resolve([]);
    }
    return new Promise((resolve, reject) => {
      pendingHelpTopicsCalls.push({
        run: (live) => {
          live
            .enableTopics(...args)
            .then(resolve)
            .catch(reject);
        },
        abort: () => resolve([]),
      });
    });
  },
  setActiveTopic: (...args: Parameters<ChromeAPI['helpTopics']['setActiveTopic']>) => {
    const api = liveHelpTopicsAPIRef.current;
    if (api) {
      return api.setActiveTopic(...args);
    }
    if (liveRuntimeUnavailable) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      pendingHelpTopicsCalls.push({
        run: (live) => {
          live
            .setActiveTopic(...args)
            .then(resolve)
            .catch(reject);
        },
        abort: () => resolve(),
      });
    });
  },
  closeHelpTopic: () => {
    enqueueOrRun(
      liveHelpTopicsAPIRef.current,
      pendingHelpTopicsCalls,
      (api) => api.closeHelpTopic(),
      () => undefined
    );
  },
};

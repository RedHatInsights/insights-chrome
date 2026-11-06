import React from 'react';
import { HelpTopic, QuickStart } from '@patternfly/quickstarts';
import { ChromeAPI, EnableTopicsArgs } from '@redhat-cloud-services/types';
import { useAtomValue } from 'jotai';
import chromeStore from '../chromeStore';
import { LiveQuickstartsAPI, liveHelpTopicsAPIRef, liveQuickstartsAPIRef, liveQuickstartsCatalogAtom } from './remoteQuickstartsAtom';

type PendingCall<T> = {
  run: (api: T) => void;
  abort: () => void;
};

let liveRuntimeUnavailable = false;
let replayRegistrationsOnPublish = false;
/** Bumped on every publish / retire / drop so a stale deferred attach is skipped. */
let publishGeneration = 0;
/**
 * Tenant registrations applied to a live runtime since the last module change.
 * Tenants stay mounted when the runtime is swapped, so they do not register
 * again; the replacement gets these replayed instead.
 */
const registeredQuickstarts = new Map<string, QuickStart[]>();
/**
 * Tenant-defined help topics (`addHelpTopics`) and whether each is enabled. Both
 * runtimes keep help topics across module changes, so unlike quickstarts this is
 * not cleared on module change. Topics loaded by name are not tracked: the
 * runtimes fetch those on demand (`setActiveTopic` / `enableTopics`).
 */
const registeredHelpTopics = new Map<string, { topic: HelpTopic; enabled: boolean }>();
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
 *
 * Both runtimes publish from a child effect and then clear their quickstarts in
 * their own mount effect, which React runs afterwards. Attach once the current
 * effect pass is over so replayed and queued registrations survive that clear.
 * Calls keep queueing until then, so they still apply in order.
 */
export function publishLiveChromeQuickstartsApis(api: { quickstartsAPI: LiveQuickstartsAPI; helpTopicsAPI: ChromeAPI['helpTopics'] }) {
  liveRuntimeUnavailable = false;
  chromeStore.set(liveQuickstartsCatalogAtom, api.quickstartsAPI.Catalog ? { Catalog: api.quickstartsAPI.Catalog } : null);
  const generation = ++publishGeneration;
  queueMicrotask(() => {
    if (generation !== publishGeneration) {
      return;
    }
    liveQuickstartsAPIRef.current = api.quickstartsAPI;
    liveHelpTopicsAPIRef.current = api.helpTopicsAPI;
    if (replayRegistrationsOnPublish) {
      replayRegistrationsOnPublish = false;
      registeredQuickstarts.forEach((quickstarts, key) => api.quickstartsAPI.set(key, quickstarts));
      replayRegisteredHelpTopics(api.helpTopicsAPI);
    }
    flushPending(pendingQuickstartsCalls, api.quickstartsAPI);
    flushPending(pendingHelpTopicsCalls, api.helpTopicsAPI);
  });
}

/**
 * Remote load failed or timed out. Drop queued calls so promises do not hang.
 * Do not fall back to leftover Chrome here — flag-on isolation stays in place.
 */
export function dropPendingLiveChromeQuickstartsApis() {
  publishGeneration += 1;
  liveRuntimeUnavailable = true;
  liveQuickstartsAPIRef.current = null;
  liveHelpTopicsAPIRef.current = null;
  chromeStore.set(liveQuickstartsCatalogAtom, null);
  flushPending(pendingQuickstartsCalls, null);
  flushPending(pendingHelpTopicsCalls, null);
}

/**
 * The runtime is being swapped for the other implementation. Detach it so calls
 * queue for the replacement instead of reaching the unmounted runtime, and replay
 * tenant registrations into the replacement when it publishes. Unlike `drop…`,
 * this does not mark the runtime unavailable and keeps queued calls.
 */
export function retireLiveChromeQuickstartsApis() {
  publishGeneration += 1;
  liveRuntimeUnavailable = false;
  replayRegistrationsOnPublish = true;
  liveQuickstartsAPIRef.current = null;
  liveHelpTopicsAPIRef.current = null;
  chromeStore.set(liveQuickstartsCatalogAtom, null);
}

/** Runtimes clear their quickstarts on module change; keep the replay registry in step. */
export function clearRegisteredChromeQuickstarts() {
  registeredQuickstarts.clear();
}

/** Test helper: empty queues and treat the runtime as not-yet-loaded (not failed). */
export function resetDelegatedChromeQuickstartsState() {
  retireLiveChromeQuickstartsApis();
  replayRegistrationsOnPublish = false;
  registeredQuickstarts.clear();
  registeredHelpTopics.clear();
  pendingQuickstartsCalls.splice(0).forEach((item) => item.abort());
  pendingHelpTopicsCalls.splice(0).forEach((item) => item.abort());
}

function addRegisteredQuickstart(api: LiveQuickstartsAPI, key: string, qs: QuickStart) {
  const added = api.add?.(key, qs) ?? false;
  if (added) {
    registeredQuickstarts.set(key, [...(registeredQuickstarts.get(key) ?? []), qs]);
  }
  return added;
}

function replayRegisteredHelpTopics(api: ChromeAPI['helpTopics']) {
  const entries = [...registeredHelpTopics.values()];
  const enabled = entries.filter((entry) => entry.enabled).map((entry) => entry.topic);
  const disabled = entries.filter((entry) => !entry.enabled).map((entry) => entry.topic);
  if (enabled.length > 0) {
    api.addHelpTopics(enabled, true);
  }
  if (disabled.length > 0) {
    api.addHelpTopics(disabled, false);
  }
}

/** Keep the enabled state of tenant-defined topics in step with the live runtime. */
function setRegisteredHelpTopicsEnabled(names: string[], enabled: boolean) {
  names.forEach((name) => {
    const entry = registeredHelpTopics.get(name);
    if (entry) {
      entry.enabled = enabled;
    }
  });
}

function enableTopicsNames(args: EnableTopicsArgs): string[] {
  const [first] = args;
  if (typeof first === 'object' && first !== null) {
    return first.names ?? [];
  }
  return args as string[];
}

/**
 * Subscribes to the published Catalog, so a catalog mounted before `onApiReady`
 * renders as soon as the runtime arrives. Pinned to `chromeStore` because tenants
 * render this under their own trees and may have their own jotai Provider.
 */
const DelegatedQuickStartCatalog = (props: Record<string, unknown>) => {
  const live = useAtomValue(liveQuickstartsCatalogAtom, { store: chromeStore });
  return live ? React.createElement(live.Catalog, props) : null;
};

export const delegatedQuickstartsAPI: LiveQuickstartsAPI = {
  version: 1,
  set: (...args: Parameters<ChromeAPI['quickStarts']['set']>) => {
    enqueueOrRun(
      liveQuickstartsAPIRef.current,
      pendingQuickstartsCalls,
      (api) => {
        api.set(...args);
        registeredQuickstarts.set(args[0], args[1]);
      },
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
  Catalog: DelegatedQuickStartCatalog as ChromeAPI['quickStarts']['Catalog'],
  updateQuickStarts: (key: string, quickstarts: QuickStart[]) => {
    enqueueOrRun(
      liveQuickstartsAPIRef.current,
      pendingQuickstartsCalls,
      (api) => {
        api.updateQuickStarts?.(key, quickstarts);
        registeredQuickstarts.set(key, quickstarts);
      },
      () => undefined
    );
  },
  add: (key: string, qs: QuickStart) => {
    const api = liveQuickstartsAPIRef.current;
    if (api) {
      return addRegisteredQuickstart(api, key, qs);
    }
    if (liveRuntimeUnavailable) {
      return false;
    }
    pendingQuickstartsCalls.push({
      run: (live) => {
        addRegisteredQuickstart(live, key, qs);
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
      (api) => {
        const [topics, enabled = true] = args;
        api.addHelpTopics(...args);
        topics.forEach((topic) => registeredHelpTopics.set(topic.name, { topic, enabled }));
      },
      () => undefined
    );
  },
  disableTopics: (...args: Parameters<ChromeAPI['helpTopics']['disableTopics']>) => {
    enqueueOrRun(
      liveHelpTopicsAPIRef.current,
      pendingHelpTopicsCalls,
      (api) => {
        api.disableTopics(...args);
        setRegisteredHelpTopicsEnabled(args, false);
      },
      () => undefined
    );
  },
  enableTopics: (...args: Parameters<ChromeAPI['helpTopics']['enableTopics']>) => {
    const enableOn = (live: ChromeAPI['helpTopics']) => {
      const result = live.enableTopics(...args);
      setRegisteredHelpTopicsEnabled(enableTopicsNames(args), true);
      return result;
    };
    const api = liveHelpTopicsAPIRef.current;
    if (api) {
      return enableOn(api);
    }
    if (liveRuntimeUnavailable) {
      return Promise.resolve([]);
    }
    return new Promise((resolve, reject) => {
      pendingHelpTopicsCalls.push({
        run: (live) => {
          enableOn(live).then(resolve).catch(reject);
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

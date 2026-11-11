import { InMemoryStorageProvider, LocalStorageProvider, UnleashClient } from '@unleash/proxy-client-react';
import { ChromeUser } from '@redhat-cloud-services/types';
import { captureException } from '@sentry/react';
import * as Sentry from '@sentry/react';
import { getEnv } from '../../utils/common';
import { withTimeout } from '../../utils/withTimeout';
import {
  FEATURE_FLAGS_INITIAL_TIMEOUT_MS,
  FEATURE_FLAGS_REFRESH_TIMEOUT_MS,
  clearLegacyFeatureFlagsCache,
  getFeatureFlagsStoragePrefix,
} from './unleashClient';

const FEATURE_FLAGS_URL = `${document.location.origin}/api/featureflags/v0`;
const FEATURE_FLAGS_PATHNAME = new URL(FEATURE_FLAGS_URL).pathname;

const createAbortError = () => Object.assign(new Error('Feature flag request was cancelled'), { name: 'AbortError' });

const createTimeoutError = (timeoutMs: number) => Object.assign(new Error(`Feature flag request timed out after ${timeoutMs}ms`), { name: 'TimeoutError' });

const fetchFeatureFlagsWithTimeout = (url: RequestInfo | URL, requestInit: RequestInit, timeoutMs: number): Promise<Response> => {
  const requestSignal = requestInit.signal;
  if (requestSignal?.aborted) {
    return Promise.reject(createAbortError());
  }

  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  requestSignal?.addEventListener('abort', abortRequest, { once: true });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  const pending = <T>() => new Promise<T>(() => undefined);
  const fetchPromise = window.fetch(url, { ...requestInit, signal: controller.signal }).catch((error: unknown) => {
    if (timedOut) {
      return pending<Response>();
    }
    if (requestSignal?.aborted) {
      throw createAbortError();
    }
    throw error;
  });
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(createTimeoutError(timeoutMs));
    }, timeoutMs);
  });

  const settle = async (): Promise<Response> => {
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    // Headers can arrive while the payload is still unread. The SDK parses the body after fetch resolves.
    // Error statuses are decided by status alone, so a stalled error body must not delay that rejection.
    if (response.body == null || response.status === 204 || response.status === 304 || response.status >= 400) {
      return response;
    }

    try {
      const payload = await Promise.race([
        response.arrayBuffer().catch((error: unknown) => {
          if (timedOut) {
            return pending<ArrayBuffer>();
          }
          throw error;
        }),
        timeoutPromise,
      ]);
      return new Response(payload, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      if (timedOut) {
        throw createTimeoutError(timeoutMs);
      }
      if (requestSignal?.aborted) {
        throw createAbortError();
      }
      throw error;
    }
  };

  return settle().finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    requestSignal?.removeEventListener('abort', abortRequest);
  });
};

const validateFeatureFlagsResponse = (response: Response, requestContext: Pick<Sentry.Event, 'tags' | 'contexts'>) => {
  const captureContext = {
    ...requestContext,
    contexts: {
      ...requestContext.contexts,
      feature_flags: { ...requestContext.contexts?.feature_flags, status_code: response.status },
    },
  };
  if (response.status >= 400) {
    Sentry.captureMessage(`Feature loading error server error! ${response.status}: ${response.statusText}.`, { ...captureContext, level: 'warning' });
    throw new Error(`Feature flag request failed with HTTP ${response.status}`);
  }

  if (response.ok) {
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const error = new Error(`Feature loading error server error! Invalid response content type. Expected 'application/json, got: ${contentType}'`);
      captureException(error, captureContext);
      throw error;
    }
  }

  return response;
};

/**
 * Only the first toggle request uses the short timeout, because it gates the initial navigation.
 * That timeout stays active until the response body is read, so a stalled payload cannot hang startup.
 * Later refreshes run while stored toggles are served, so a slow proxy must not flap the degraded state.
 */
export const createFetchFeatureFlags = (): ((url: RequestInfo | URL, requestInit: RequestInit) => Promise<Response>) => {
  let initialRequestSettled = false;

  return async (url: RequestInfo | URL, requestInit: RequestInit) => {
    const requestUrl = typeof url === 'string' || url instanceof URL ? url.toString() : url.url;
    const isFeatureFlagsRequest = new URL(requestUrl, document.location.origin).pathname === FEATURE_FLAGS_PATHNAME;
    if (!isFeatureFlagsRequest) {
      return window.fetch(url, requestInit);
    }

    const timeoutMs = initialRequestSettled ? FEATURE_FLAGS_REFRESH_TIMEOUT_MS : FEATURE_FLAGS_INITIAL_TIMEOUT_MS;
    const captureContext = {
      tags: { 'chrome.operation': 'feature_flags.fetch', 'chrome.error_surface': 'request' },
      contexts: {
        feature_flags: {
          // The SDK URL contains identity data. Report only this fixed endpoint, never query parameters, headers, or bodies.
          endpoint: FEATURE_FLAGS_PATHNAME,
          method: (requestInit.method ?? (typeof url === 'string' || url instanceof URL ? 'GET' : url.method)).toUpperCase(),
          phase: initialRequestSettled ? 'refresh' : 'initial',
          timeout_ms: timeoutMs,
        },
      },
    };
    let response: Response;
    try {
      response = await fetchFeatureFlagsWithTimeout(url, requestInit, timeoutMs);
    } catch (error) {
      if (!requestInit.signal?.aborted) {
        initialRequestSettled = true;
        captureException(error, captureContext);
      }
      throw error;
    }

    initialRequestSettled = true;
    return validateFeatureFlagsResponse(response, captureContext);
  };
};

const config = {
  url: FEATURE_FLAGS_URL,
  clientKey: 'proxy-123',
  appName: 'web',
  headerName: 'X-Unleash-Auth',
  refreshInterval: 60000,
  metricsInterval: 120000,
};

const createStorageProvider = (orgId?: string, userId?: string) => {
  const prefix = getFeatureFlagsStoragePrefix(orgId, userId);
  // Without a complete identity, never read another account's toggles; fall back to flags-disabled on outage.
  return prefix ? new LocalStorageProvider(prefix) : new InMemoryStorageProvider();
};

/**
 * Records every context-driven toggle refresh, whoever starts it (releaseAtom's Preview toggle,
 * this module, or a test), so bootstrap can wait for toggles that match the current context.
 */
class ScopedUnleashClient extends UnleashClient {
  private contextRefresh: Promise<unknown> = Promise.resolve();

  override updateToggles(): Promise<void> {
    const refresh = super.updateToggles();
    // A failed refresh is reported by the client's error event; waiters only need it settled.
    this.contextRefresh = refresh.catch(() => undefined);
    return refresh;
  }

  /** Resolves once no context refresh is pending, including refreshes started while waiting. */
  async contextSettled(): Promise<void> {
    let pending: Promise<unknown> | undefined;
    while (pending !== this.contextRefresh) {
      pending = this.contextRefresh;
      await pending;
    }
  }
}

type ClientRecord = {
  key: string;
  client: ScopedUnleashClient;
  start?: Promise<void>;
  active: boolean;
  started: boolean;
  stopped: boolean;
};
/** The client for the most recently requested identity. */
let current: ClientRecord | undefined;
/** The client the React provider is attached to. Only the provider's cleanup stops it. */
let attached: ClientRecord | undefined;
const records = new WeakMap<UnleashClient, ClientRecord>();

const PREVIEW_CONTEXT_FIELD = 'platform.chrome.ui.preview';

/** Update Preview on the existing client, as releaseAtom does, so FlagProvider keeps the same instance. */
function updatePreviewContext(client: UnleashClient, isPreview: boolean): void {
  // appName and environment are static; passing them back makes the SDK warn.
  const { appName, environment, ...context } = client.getContext();
  if ((context as Record<string, unknown>)[PREVIEW_CONTEXT_FIELD] === isPreview) {
    return;
  }
  // The SDK context type does not declare custom top-level fields. The refresh is tracked by the client.
  const nextContext = { ...context, [PREVIEW_CONTEXT_FIELD]: isPreview };
  void client.updateContext(nextContext);
}

/** Stop a client that is being replaced, unless the provider is still attached to it. */
function releaseClient(record: ClientRecord | undefined): void {
  if (record && record !== attached) {
    stopFeatureFlagsClient(record.client);
  }
}

/**
 * Shared bootstrap/provider client, scoped to the identity. Preview is part of the rollout context
 * but not of the client identity: a Preview change updates the existing client's context, so the
 * React FlagProvider never holds a replaced client. A client stopped by provider cleanup is
 * replaced, matching a fresh provider mount.
 *
 * A bootstrap for a new identity never stops the provider's client: if that identity is superseded
 * before it publishes (A → B → A), the lookup for A reuses the provider's live client instead of
 * leaving the provider attached to a stopped one. The provider stops its client when it switches.
 */
export function getFeatureFlagsClient(user: ChromeUser | undefined, isPreview: boolean): UnleashClient {
  clearLegacyFeatureFlagsCache();
  const orgId = user?.identity.internal?.org_id;
  const userId = user?.identity.internal?.account_id;
  const accountNumber = user?.identity.account_number;
  const email = user?.identity.user?.email;
  const identityContext = {
    'platform.chrome.ui.env': getEnv(),
    userId,
    orgId,
    accountNumber,
    ...(user
      ? {
          // Typed as strings, as in the provider's DeepRequired user; the SDK drops undefined values.
          properties: {
            account_number: accountNumber,
            email,
          } as Record<string, string>,
        }
      : {}),
  };
  const key = JSON.stringify(identityContext);
  const reusable = [current, attached].find((record) => record?.key === key && !record.stopped);
  if (reusable) {
    if (reusable !== current) {
      releaseClient(current);
      current = reusable;
    }
    updatePreviewContext(reusable.client, isPreview);
    return reusable.client;
  }
  releaseClient(current);
  const context = { [PREVIEW_CONTEXT_FIELD]: isPreview, ...identityContext };
  const client = new ScopedUnleashClient({
    ...config,
    fetch: createFetchFeatureFlags(),
    storageProvider: createStorageProvider(orgId, userId),
    context,
  });
  current = { key, client, active: false, started: false, stopped: false };
  records.set(client, current);
  return client;
}

/** True once bootstrap or a previous provider mount has started this client. */
export function isFeatureFlagsClientStarted(client: UnleashClient): boolean {
  return Boolean(records.get(client)?.start);
}

/**
 * Mark the client the React provider holds; it stays live until the provider detaches, even if a
 * bootstrap for another identity requests a new client meanwhile. Returns the detach callback.
 */
export function attachFeatureFlagsClient(client: UnleashClient): () => void {
  const record = records.get(client);
  if (!record) {
    return () => undefined;
  }
  attached = record;
  return () => {
    if (attached === record) {
      attached = undefined;
    }
  };
}

/** Start once even when bootstrap and the React provider both need the client. */
export function startFeatureFlagsClient(client: UnleashClient): Promise<void> {
  if (current?.client !== client && attached?.client !== client) {
    return Promise.resolve();
  }
  const record = records.get(client)!;
  record.active = true;
  record.stopped = false;
  record.start ??= client.start().finally(() => {
    record.started = true;
    if (!record.active) {
      stopFeatureFlagsClient(client);
    }
  });
  return record.start;
}

/** Stop polling on unmount or identity changes, including a start that has not settled yet. */
export function stopFeatureFlagsClient(client: UnleashClient): void {
  const record = records.get(client);
  if (record) {
    record.active = false;
    record.stopped = true;
    if (record.started) {
      client.stop();
      record.start = undefined;
      record.started = false;
    }
  }
}

/** Resolve a bootstrap flag using scoped stored toggles on outage; unknown flags default off. */
export async function getBootstrapFeatureFlag(user: ChromeUser, isPreview: boolean, flag: string): Promise<boolean> {
  try {
    const client = getFeatureFlagsClient(user, isPreview);
    // A reused client may still be refetching toggles for a new Preview context, including a
    // refresh releaseAtom started before this lookup; evaluating before it settles reads stale toggles.
    const record = records.get(client);
    const ready = startFeatureFlagsClient(client).then(() => record?.client.contextSettled());
    await withTimeout(ready, FEATURE_FLAGS_INITIAL_TIMEOUT_MS, undefined);
    return client.isEnabled(flag);
  } catch {
    return false;
  }
}

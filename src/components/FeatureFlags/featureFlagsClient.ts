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
  const fetchPromise = window.fetch(url, { ...requestInit, signal: controller.signal }).catch((error: unknown) => {
    if (requestSignal?.aborted && !timedOut) {
      throw createAbortError();
    }
    throw error;
  });
  const timeoutPromise = new Promise<Response>((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(createTimeoutError(timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([fetchPromise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    requestSignal?.removeEventListener('abort', abortRequest);
  });
};

const validateFeatureFlagsResponse = (response: Response) => {
  if (response.status >= 400) {
    Sentry.captureMessage(`Feature loading error server error! ${response.status}: ${response.statusText}.`, 'warning');
    throw new Error(`Feature flag request failed with HTTP ${response.status}`);
  }

  if (response.ok) {
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const error = new Error(`Feature loading error server error! Invalid response content type. Expected 'application/json, got: ${contentType}'`);
      captureException(error);
      throw error;
    }
  }

  return response;
};

/**
 * Only the first toggle request uses the short timeout, because it gates the initial navigation.
 * Later refreshes run while stored toggles are served, so a slow proxy must not flap the degraded state.
 */
export const createFetchFeatureFlags = () => {
  let initialRequestSettled = false;

  return async (url: RequestInfo | URL, requestInit: RequestInit) => {
    const requestUrl = typeof url === 'string' || url instanceof URL ? url.toString() : url.url;
    const isFeatureFlagsRequest = new URL(requestUrl, document.location.origin).pathname === FEATURE_FLAGS_PATHNAME;
    if (!isFeatureFlagsRequest) {
      return window.fetch(url, requestInit);
    }

    const timeoutMs = initialRequestSettled ? FEATURE_FLAGS_REFRESH_TIMEOUT_MS : FEATURE_FLAGS_INITIAL_TIMEOUT_MS;
    let response: Response;
    try {
      response = await fetchFeatureFlagsWithTimeout(url, requestInit, timeoutMs);
    } catch (error) {
      if (!requestInit.signal?.aborted) {
        initialRequestSettled = true;
        captureException(error);
      }
      throw error;
    }

    initialRequestSettled = true;
    return validateFeatureFlagsResponse(response);
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

type ClientRecord = {
  key: string;
  client: UnleashClient;
  start?: Promise<void>;
  contextUpdate?: Promise<void>;
  active: boolean;
  started: boolean;
  stopped: boolean;
};
let current: ClientRecord | undefined;
const records = new WeakMap<UnleashClient, ClientRecord>();

const PREVIEW_CONTEXT_FIELD = 'platform.chrome.ui.preview';

/** Update Preview on the existing client, as releaseAtom does, so FlagProvider keeps the same instance. */
function updatePreviewContext(client: UnleashClient, isPreview: boolean): Promise<void> | undefined {
  // appName and environment are static; passing them back makes the SDK warn.
  const { appName, environment, ...context } = client.getContext();
  if ((context as Record<string, unknown>)[PREVIEW_CONTEXT_FIELD] === isPreview) {
    return undefined;
  }
  // The SDK context type does not declare custom top-level fields.
  const nextContext = { ...context, [PREVIEW_CONTEXT_FIELD]: isPreview };
  return client.updateContext(nextContext);
}

/**
 * Shared bootstrap/provider client, scoped to the identity. Preview is part of the rollout context
 * but not of the client identity: a Preview change updates the existing client's context, so the
 * React FlagProvider never holds a replaced client. A client stopped by provider cleanup is
 * replaced, matching a fresh provider mount.
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
  if (current?.key === key && !current.stopped) {
    const contextUpdate = updatePreviewContext(current.client, isPreview);
    if (contextUpdate) {
      // Bootstrap waits for this; anywhere else a failed refresh is reported by the client's error event.
      current.contextUpdate = contextUpdate.catch(() => undefined);
    }
    return current.client;
  }
  if (current) {
    stopFeatureFlagsClient(current.client);
  }
  const context = { [PREVIEW_CONTEXT_FIELD]: isPreview, ...identityContext };
  const client = new UnleashClient({
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

/** Start once even when bootstrap and the React provider both need the client. */
export function startFeatureFlagsClient(client: UnleashClient): Promise<void> {
  if (current?.client !== client) {
    return Promise.resolve();
  }
  const record = current;
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
    // A reused client may still be refetching toggles for a new Preview context.
    const ready = startFeatureFlagsClient(client).then(() => records.get(client)?.contextUpdate);
    await withTimeout(ready, FEATURE_FLAGS_INITIAL_TIMEOUT_MS, undefined);
    return client.isEnabled(flag);
  } catch {
    return false;
  }
}

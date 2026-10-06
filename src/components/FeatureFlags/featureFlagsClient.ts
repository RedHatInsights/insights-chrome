import { InMemoryStorageProvider, LocalStorageProvider, UnleashClient } from '@unleash/proxy-client-react';
import { ChromeUser } from '@redhat-cloud-services/types';
import { captureException, captureMessage } from '@sentry/react';
import { getEnv } from '../../utils/common';
import { withTimeout } from '../../utils/withTimeout';
import { UNLEASH_ERROR_KEY } from './unleashClient';

export const FEATURE_FLAGS_INITIAL_TIMEOUT_MS = 5000;
const FEATURE_FLAGS_REFRESH_TIMEOUT_MS = 15000;
const FEATURE_FLAGS_PATH = '/api/featureflags/v0';

type ClientRecord = { key: string; client: UnleashClient; start?: Promise<void>; active: boolean; started: boolean };
let current: ClientRecord | undefined;
const records = new WeakMap<UnleashClient, ClientRecord>();

/** The first toggle fetch gates authentication; background refreshes use the longer budget. */
export function createFeatureFlagsFetch() {
  let initial = true;
  return async (url: RequestInfo | URL, requestInit: RequestInit): Promise<Response> => {
    const requestUrl = typeof url === 'string' || url instanceof URL ? url.toString() : url.url;
    if (new URL(requestUrl, document.location.origin).pathname !== FEATURE_FLAGS_PATH) {
      return window.fetch(url, requestInit);
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    requestInit.signal?.addEventListener('abort', abort, { once: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    let httpFailure = false;
    try {
      if (requestInit.signal?.aborted) {
        controller.abort();
        throw Object.assign(new Error('Feature flag request cancelled'), { name: 'AbortError' });
      }
      const timeoutMs = initial ? FEATURE_FLAGS_INITIAL_TIMEOUT_MS : FEATURE_FLAGS_REFRESH_TIMEOUT_MS;
      const response = await Promise.race([
        window.fetch(url, { ...requestInit, signal: controller.signal }),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(Object.assign(new Error('Feature flag request timed out'), { name: 'TimeoutError' }));
          }, timeoutMs);
        }),
      ]);
      if (response.status >= 400) {
        httpFailure = true;
        captureMessage(`Feature loading error server error! ${response.status}: ${response.statusText}.`, 'warning');
        throw new Error(`Feature flag request failed with HTTP ${response.status}`);
      }
      if (response.ok && !response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Invalid feature flag response content type');
      }
      localStorage.setItem(UNLEASH_ERROR_KEY, 'false');
      return response;
    } catch (error) {
      if (!requestInit.signal?.aborted) {
        localStorage.setItem(UNLEASH_ERROR_KEY, 'true');
        if (!httpFailure) {
          captureException(error);
        }
      }
      // Keep the SDK's last-known-good toggles on outage instead of replacing them with [].
      throw error;
    } finally {
      initial = false;
      clearTimeout(timer);
      requestInit.signal?.removeEventListener('abort', abort);
    }
  };
}

/** Shared bootstrap/provider client, using exactly the same identity and rollout context. */
export function getFeatureFlagsClient(user: ChromeUser | undefined, isPreview: boolean): UnleashClient {
  const orgId = user?.identity.internal?.org_id;
  const userId = user?.identity.internal?.account_id;
  const accountNumber = user?.identity.account_number;
  const email = user?.identity.user?.email;
  const context = {
    'platform.chrome.ui.preview': isPreview,
    'platform.chrome.ui.env': getEnv(),
    orgId,
    userId,
    accountNumber,
    ...(user ? { properties: { ...(accountNumber ? { account_number: accountNumber } : {}), ...(email ? { email } : {}) } } : {}),
  };
  const key = JSON.stringify(context);
  if (current?.key === key) {
    return current.client;
  }
  if (current) {
    stopFeatureFlagsClient(current.client);
  }
  const storageProvider = orgId && userId ? new LocalStorageProvider(`unleash:repository:${orgId}:${userId}`) : new InMemoryStorageProvider();
  const client = new UnleashClient({
    url: `${document.location.origin}${FEATURE_FLAGS_PATH}`,
    clientKey: 'proxy-123',
    appName: 'web',
    headerName: 'X-Unleash-Auth',
    refreshInterval: 60000,
    metricsInterval: 120000,
    fetch: createFeatureFlagsFetch(),
    storageProvider,
    context,
  });
  current = { key, client, active: false, started: false };
  records.set(client, current);
  return client;
}

/** Start once even when bootstrap and the React provider both need the client. */
export function startFeatureFlagsClient(client: UnleashClient): Promise<void> {
  if (current?.client !== client) {
    return Promise.resolve();
  }
  const record = current;
  record.active = true;
  record.start ??= client
    .start()
    .catch(() => undefined)
    .then(() => {
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
    await withTimeout(startFeatureFlagsClient(client), FEATURE_FLAGS_INITIAL_TIMEOUT_MS, undefined);
    return client.isEnabled(flag);
  } catch {
    return false;
  }
}

import React, { useContext, useEffect, useMemo } from 'react';
import { FlagProvider, IFlagProvider, InMemoryStorageProvider, LocalStorageProvider, UnleashClient } from '@unleash/proxy-client-react';
import { DeepRequired } from 'utility-types';
import { captureException } from '@sentry/react';
import * as Sentry from '@sentry/react';
import { useAtomValue, useSetAtom } from 'jotai';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import { setServiceDegradedAtom } from '../../state/atoms/degradedStateAtom';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import {
  FEATURE_FLAGS_INITIAL_TIMEOUT_MS,
  FEATURE_FLAGS_REFRESH_TIMEOUT_MS,
  clearLegacyFeatureFlagsCache,
  getFeatureFlagsStoragePrefix,
  setFeatureFlagsError,
  setUnleashClient,
} from './unleashClient';
import { getEnv } from '../../utils/common';

const FEATURE_FLAGS_URL = `${document.location.origin}/api/featureflags/v0`;
const FEATURE_FLAGS_PATHNAME = new URL(FEATURE_FLAGS_URL).pathname;

const createAbortError = () => Object.assign(new Error('Feature flag request was cancelled'), { name: 'AbortError' });

const createTimeoutError = (timeoutMs: number) => Object.assign(new Error(`Feature flag request timed out after ${timeoutMs}ms`), { name: 'TimeoutError' });

const isMetricsError = (error: unknown) => typeof error === 'object' && error !== null && 'type' in error && error.type === 'metrics';

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

const config: IFlagProvider['config'] = {
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

const FeatureFlagsStateBridge = ({ client }: { client: UnleashClient }) => {
  const setServiceDegraded = useSetAtom(setServiceDegradedAtom);

  useEffect(() => {
    const notifyInitialFlags = () => {
      // The SDK loads stored toggles during initialization without emitting `update`.
      client.emit('update');
    };
    const markDegraded = (error?: unknown) => {
      if (isMetricsError(error)) {
        return;
      }
      setFeatureFlagsError(true);
      setServiceDegraded({ service: 'featureFlags', degraded: true });
    };
    const markHealthy = () => {
      setFeatureFlagsError(false);
      setServiceDegraded({ service: 'featureFlags', degraded: false });
    };

    client.on('initialized', notifyInitialFlags);
    client.on('error', markDegraded);
    client.on('ready', markHealthy);
    client.on('recovered', markHealthy);

    void client.start().catch(markDegraded);

    return () => {
      client.off('initialized', notifyInitialFlags);
      client.off('error', markDegraded);
      client.off('ready', markHealthy);
      client.off('recovered', markHealthy);
      client.stop();
    };
  }, [client, setServiceDegraded]);

  return null;
};

const FeatureFlagsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useContext(ChromeAuthContext) as DeepRequired<ChromeAuthContextValue>;
  const isPreview = useAtomValue(isPreviewAtom);
  const client = useMemo(() => {
    clearLegacyFeatureFlagsCache();
    const unleashClient = new UnleashClient({
      ...config,
      fetch: createFetchFeatureFlags(),
      storageProvider: createStorageProvider(user?.identity.internal?.org_id, user?.identity.internal?.account_id),
      context: {
        // the unleash context is not generic, look for issue/PR in the unleash repo or create one
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'platform.chrome.ui.preview': isPreview,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'platform.chrome.ui.env': getEnv(),
        userId: user?.identity.internal?.account_id,
        orgId: user?.identity.internal?.org_id,
        accountNumber: user?.identity.account_number,
        ...(user
          ? {
              properties: {
                account_number: user?.identity.account_number,
                email: user?.identity.user.email,
              },
            }
          : {}),
      },
    });
    setUnleashClient(unleashClient);
    return unleashClient;
  }, []);

  return (
    <FlagProvider unleashClient={client} startClient={false} stopClient={false}>
      <FeatureFlagsStateBridge client={client} />
      {children}
    </FlagProvider>
  );
};

export default FeatureFlagsProvider;

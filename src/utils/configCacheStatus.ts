export const CONFIG_SOURCES = {
  SSO_CONFIG: 'sso-config-generated',
  FED_MODULES: 'fed-modules-generated',
  NAVIGATION: 'bundles-generated',
  SERVICE_TILES: 'service-tiles-generated',
  SEARCH_INDEX: 'search-index-generated',
} as const;

export type ConfigSource = (typeof CONFIG_SOURCES)[keyof typeof CONFIG_SOURCES];

type ConfigCacheStatusListener = (degraded: boolean) => void;

const cachedSources = new Set<ConfigSource>();
const listeners = new Set<ConfigCacheStatusListener>();

const getDegradedState = () => cachedSources.size > 0;

const notifyListeners = (degraded: boolean) => {
  listeners.forEach((listener) => listener(degraded));
};

export const reportConfigSource = (source: ConfigSource, fromCache: boolean): void => {
  const wasDegraded = getDegradedState();

  if (fromCache) {
    cachedSources.add(source);
  } else {
    cachedSources.delete(source);
  }

  const isDegraded = getDegradedState();
  if (isDegraded !== wasDegraded) {
    notifyListeners(isDegraded);
  }
};

export const subscribeConfigCacheStatus = (listener: ConfigCacheStatusListener): (() => void) => {
  listeners.add(listener);
  listener(getDegradedState());

  return () => {
    listeners.delete(listener);
  };
};

// Kept for isolated tests; production state is reset by each source reporting live data.
export const resetConfigCacheStatus = (): void => {
  const wasDegraded = getDegradedState();
  cachedSources.clear();
  if (wasDegraded) {
    notifyListeners(false);
  }
};

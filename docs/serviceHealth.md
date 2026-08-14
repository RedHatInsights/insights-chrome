# Service Health Degraded State API

## Overview

Chrome provides infrastructure for displaying service degradation alerts. When backend services fail (entitlements, user personalization, navigation config, feature flags), consuming apps can mark services as degraded, triggering a banner notification.

## Feature Flag

`platform.chrome.degraded-state-banner` - Enables degraded state banner feature

## Module Federation Hook

### Import via Scalprum

```tsx
import { useRemoteHook } from '@scalprum/react-core';

const MyApp = () => {
  const { hookResult, loading, error } = useRemoteHook<DegradedStateAPI>({
    scope: 'chrome',
    module: './serviceHealth/useDegradedState'
  });

  if (loading) return <Spinner />;
  if (error) return <div>Error loading service health</div>;

  const { 
    serviceHealth, 
    isAnyServiceDegraded, 
    isBannerEnabled,
    setEntitlementsDegraded 
  } = hookResult;

  // Mark entitlements as degraded on API error
  useEffect(() => {
    fetchEntitlements().catch(() => {
      setEntitlementsDegraded(true);
    });
  }, []);

  return <div>...</div>;
};
```

### API Reference

```typescript
type DegradedStateAPI = {
  // Read-only state
  serviceHealth: ServiceHealthStatus;           // Current degradation status
  isAnyServiceDegraded: boolean;               // True if any service degraded
  isBannerEnabled: boolean;                    // Feature flag status
  
  // State setters
  setUserPersonalizationDegraded: (degraded: boolean) => void;
  setEntitlementsDegraded: (degraded: boolean) => void;
  setConfigFromCacheDegraded: (degraded: boolean) => void;
  setFeatureFlagsDegraded: (degraded: boolean) => void;
};

type ServiceHealthStatus = {
  userPersonalization: boolean;  // true = degraded
  entitlements: boolean;
  configFromCache: boolean;
  featureFlags: boolean;
};
```

## Banner Behavior

- **Visibility:** Shows when `isBannerEnabled` AND `isAnyServiceDegraded`
- **Dismissal:** Session-based (reappears on refresh)
- **Variant:** 
  - 1-2 degraded services → info (blue)
  - 3+ degraded services → warning (yellow)

## Use Cases

### 1. API Error Handling

```typescript
try {
  await fetchUserPreferences();
} catch {
  setUserPersonalizationDegraded(true);
}
```

### 2. Cache Fallback

```typescript
const config = await fetchConfig().catch(() => {
  setConfigFromCacheDegraded(true);
  return getCachedConfig();
});
```

### 3. Monitoring Feature Flags

```typescript
if (getFeatureFlagsError()) {
  setFeatureFlagsDegraded(true);
}
```

## Recovery

Mark service as recovered when API succeeds:

```typescript
fetchEntitlements()
  .then(() => setEntitlementsDegraded(false))
  .catch(() => setEntitlementsDegraded(true));
```

## Testing

Trigger banner locally:

```javascript
// Browser console
insights.chrome.enable.degradedStateBanner();

// To clear (returns cleanup function)
const clear = insights.chrome.enable.degradedStateBanner();
clear(); // Clears degraded state
```

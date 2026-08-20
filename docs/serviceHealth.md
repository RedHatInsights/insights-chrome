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

  // Hook BEFORE early returns
  useEffect(() => {
    if (!hookResult?.setServiceDegraded) return;
    
    fetchEntitlements().catch(() => {
      hookResult.setServiceDegraded({ service: 'entitlements', degraded: true });
    });
  }, [hookResult]);

  // Early returns AFTER hooks
  if (loading) return <Spinner />;
  if (error) return <div>Error loading service health</div>;

  const { 
    serviceHealth, 
    isAnyServiceDegraded, 
    isBannerEnabled,
    setServiceDegraded,
  } = hookResult;

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
  
  // Generic state setter
  setServiceDegraded: (params: { service: keyof ServiceHealthStatus; degraded: boolean }) => void;
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
- **Variant:** Always warning (yellow)
- **Icon:** Exclamation triangle icon
- **Dismissal:** Not dismissible - persists until services recover
- **Placement:** Above header, below preview banner

## Use Cases

### 1. API Error Handling

```typescript
try {
  await fetchUserPreferences();
} catch {
  setServiceDegraded({ service: 'userPersonalization', degraded: true });
}
```

### 2. Cache Fallback

```typescript
const config = await fetchConfig().catch(() => {
  setServiceDegraded({ service: 'configFromCache', degraded: true });
  return getCachedConfig();
});
```

### 3. Monitoring Feature Flags

```typescript
if (getFeatureFlagsError()) {
  setServiceDegraded({ service: 'featureFlags', degraded: true });
}
```

## Recovery

Mark service as recovered when API succeeds:

```typescript
fetchEntitlements()
  .then(() => setServiceDegraded({ service: 'entitlements', degraded: false }))
  .catch(() => setServiceDegraded({ service: 'entitlements', degraded: true }));
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

# PatternFly 5 Styles Cutoff Preparation

The `usePf5Styles` hook is an internal feature in insights-chrome that conditionally injects PatternFly 5 (PF5) styles into the platform. This documentation is intended for UI module developers and platform maintainers to understand how to prepare for the upcoming PF5 styles removal.

## Overview

The platform has migrated to PatternFly 6 (PF6) as the default. PF5 styles are scheduled to be completely removed from the platform. This hook allows developers to test their applications in the future state (PF6 only) to ensure they work properly when PF5 styles are no longer available.

**Current State**: PF6 is default, PF5 styles available via this hook
**Future State**: PF6 only, PF5 styles completely removed

## Control Mechanisms

### Developer Override (Primary for Testing)

Developers can control PF5 style injection using localStorage:

```javascript
// INJECT PF5 styles (current transition state - PF6 + PF5)
localStorage.setItem('@chrome/pf-5-enabled', 'true');

// REMOVE PF5 styles (future state after cutoff - PF6 only)
localStorage.setItem('@chrome/pf-5-enabled', 'false');

// Use feature flag setting
localStorage.removeItem('@chrome/pf-5-enabled');

// Then refresh the page
```

### Feature Flag: `platform.chrome.pf5`

The `platform.chrome.pf5` feature flag controls the default behavior:

- When enabled: PF5 styles are injected alongside PF6
- When disabled: PF6 only (preparing for cutoff)

## For UI Module Developers

### Preparing for PF5 Cutoff

**Test your module without PF5 styles:**
```javascript
localStorage.setItem('@chrome/pf-5-enabled', 'false');
// Refresh page - you're now seeing the future state (PF6 only)
// Test your module thoroughly to ensure it works correctly
```

**Compare with current state:**
```javascript
localStorage.setItem('@chrome/pf-5-enabled', 'true');
// Refresh page - you're now seeing current state (PF6 + PF5)
// Compare behavior and identify any differences
```

### What to Look For

When testing with PF5 disabled (`'false'`):

1. **Layout Issues**: Check for broken layouts, spacing, or alignment
2. **Visual Inconsistencies**: Look for styling differences or missing styles
3. **Component Behavior**: Ensure interactive components still work correctly
4. **Responsive Design**: Test across different screen sizes

## Platform Maintainers

### Cutoff Strategy

1. **Testing Phase**: Encourage developers to test with PF5 disabled
2. **Gradual Rollout**: Use feature flag to gradually disable PF5 for user segments
3. **Full Cutoff**: Completely remove PF5 styles and this hook

### Feature Flag Configuration

- **Flag Name**: `platform.chrome.pf5`
- **Type**: Boolean
- **Current**: `true` (PF5 styles injected)
- **Target**: `false` (PF6 only, preparing for removal)

### Override Priority Logic

1. **localStorage override** (`@chrome/pf-5-enabled` set to `'true'` or `'false'`) - highest priority
2. **Feature flag** (`platform.chrome.pf5`) - fallback when no override exists

## Technical Details

### Behavior

- **Hook enabled**: Injects `<link>` element with PF5 stylesheet into document head
- **Hook disabled**: No PF5 styles injected, PF6 only
- **Cleanup**: Automatically removes stylesheet when component unmounts

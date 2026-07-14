# Dark Mode / Color Scheme Hook

Chrome exposes a `useDarkModeStore` remote hook via Module Federation that allows consuming HCC apps to react to the user's color scheme preference (dark/light mode).

## Basic Usage

### Prerequisites

1. Your app must be running inside the HCC Chrome shell (Scalprum provider is supplied by Chrome automatically)
2. Install `@scalprum/react-core` if not already available: `npm install @scalprum/react-core`

### Example

```tsx
import { useRemoteHook } from '@scalprum/react-core';

interface DarkModeState {
  isDark: boolean;
}

function MyComponent() {
  const { hookResult: useDarkModeStore, loading } = useRemoteHook<() => DarkModeState>({
    scope: 'chrome',
    module: './theme/useDarkModeStore',
    importName: 'useDarkModeStore',
  });

  if (loading || !useDarkModeStore) {
    return <div>Loading theme...</div>;
  }

  const { isDark } = useDarkModeStore();

  return (
    <div>
      Current theme: {isDark ? 'Dark' : 'Light'}
    </div>
  );
}
```

## Important Caveats

1. **Loading state handling is required.** The hook value is `null`/`undefined` until the Chrome module is loaded over the network. Always check `loading` or guard against `!useDarkModeStore` before calling it.

2. **Module path matters.** The correct module path is `./theme/useDarkModeStore`, **not** `./state/stores/darkModeStore`. The module path corresponds to the key in Chrome's webpack Module Federation `exposes` configuration, not the file system path.

3. **No provider setup needed.** Apps running in the HCC shell are already wrapped in the Scalprum provider by Chrome. No additional `ScalprumProvider` configuration is required.

4. **`importName` is required.** The hook is a named export, so you must specify `importName: 'useDarkModeStore'` in the `useRemoteHook` options.

## Return Value

The `useDarkModeStore` hook returns an object with:

| Property | Type | Description |
|----------|------|-------------|
| `isDark` | `boolean` | `true` when dark mode is active, `false` when light mode is active |

## Complete Working Example

A full component that conditionally renders content based on the user's color scheme:

```tsx
import React from 'react';
import { useRemoteHook } from '@scalprum/react-core';

interface DarkModeState {
  isDark: boolean;
}

function ThemeAwareComponent() {
  const { hookResult: useDarkModeStore, loading, error } = useRemoteHook<() => DarkModeState>({
    scope: 'chrome',
    module: './theme/useDarkModeStore',
    importName: 'useDarkModeStore',
  });

  // Handle loading state — the Chrome module is fetched asynchronously
  if (loading) {
    return <div>Loading theme preference...</div>;
  }

  // Handle error state
  if (error) {
    console.warn('Failed to load dark mode store:', error);
    // Fall back to light mode behavior
    return <MyContent isDark={false} />;
  }

  // Guard against hookResult being undefined
  if (!useDarkModeStore) {
    return <MyContent isDark={false} />;
  }

  const { isDark } = useDarkModeStore();

  return <MyContent isDark={isDark} />;
}

function MyContent({ isDark }: { isDark: boolean }) {
  return (
    <div style={{ background: isDark ? '#1a1a1a' : '#ffffff' }}>
      <p>The user prefers {isDark ? 'dark' : 'light'} mode.</p>
    </div>
  );
}
```

## CSS-Based Alternatives

For simple show/hide scenarios based on the active theme, you can use CSS classes instead of the JavaScript hook. Chrome applies the `pf-v6-theme-dark` class to the document root when dark mode is active.

### Show/Hide Elements by Theme

```css
/* Only visible in light mode */
.show-in-light {
  display: revert;
}
.pf-v6-theme-dark .show-in-light {
  display: none;
}

/* Only visible in dark mode */
.show-in-dark {
  display: none;
}
.pf-v6-theme-dark .show-in-dark {
  display: revert;
}
```

### Theme-Specific Styling

```css
.my-component {
  background: #ffffff;
  color: #151515;
}

.pf-v6-theme-dark .my-component {
  background: #1a1a1a;
  color: #e0e0e0;
}
```

### When to Use CSS vs. the Hook

| Use Case | Approach |
|----------|----------|
| Simple show/hide of elements | CSS classes |
| Theme-specific colors or styling | CSS classes |
| Conditional rendering logic | `useDarkModeStore` hook |
| Fetching theme-specific data | `useDarkModeStore` hook |
| Passing theme to third-party libraries | `useDarkModeStore` hook |

## How It Works Internally

The `useDarkModeStore` hook is backed by a Scalprum shared store (`createSharedStore` from `@scalprum/core`). Chrome manages the store state and dispatches `SET_DARK` / `SET_LIGHT` events when the user changes their color scheme preference in the settings dropdown.

The store is a singleton: all consumers share the same instance, so updates are immediately reflected across all mounted components.

Source: [`src/state/stores/darkModeStore.ts`](../src/state/stores/darkModeStore.ts)

## References

- [Scalprum remote hooks documentation](https://github.com/scalprum/scaffolding/blob/main/packages/react-core/docs/use-remote-hook.md)
- [Search hook documentation](./searchHook.md) (another remote hook example)
- [PR #3574](https://github.com/RedHatInsights/insights-chrome/pull/3574) — initial implementation
- [PR #3593](https://github.com/RedHatInsights/insights-chrome/pull/3593) — default export fix

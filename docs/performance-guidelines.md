# Performance Guidelines

## Code Splitting

insights-chrome is the shell for the entire HCC platform. Its bundle size and load time directly affect every application.

### Lazy Loading

- Use `React.lazy()` for route-level components and large feature modules
- Wrap lazy components in `<Suspense>` with appropriate fallbacks
- Loading fallback component: `src/utils/loading-fallback.tsx`

### Dynamic Imports

- Module Federation remotes are loaded on demand — do not eagerly import remote modules
- Use dynamic `import()` for optional features (analytics, debugging tools)
- `src/chrome/preload-ui-module.ts` handles preloading of critical UI modules

## Bundle Optimization

### Webpack Configuration

- Production builds use `TerserPlugin` for minification
- CSS is extracted via `MiniCssExtractPlugin` with content hashing
- Source maps are hidden in production (`hidden-source-map`)
- Bundle analysis: `npm run analyze` (uses `webpack-bundle-analyzer`)

### Singleton Sharing

Shared Module Federation singletons (`react`, `react-dom`, `react-intl`, etc.) are loaded **once** and reused across all consuming apps. This prevents duplicate bundles but means:

- Version changes cascade to all apps
- Eager singletons (`react`, `react-dom`, `react-intl`) are included in Chrome's initial bundle
- Non-eager singletons load on first use

### Tree Shaking

- Use named exports over default exports where possible
- Avoid side effects in module-level code
- Mark pure functions appropriately for the minifier

## Caching

### Build Cache

- SWC caching is used for fast rebuilds
- Webpack filesystem cache with content hashing
- Production filenames include `[contenthash]` for long-term browser caching

### Runtime Cache

- `src/utils/cache.ts` provides a caching utility
- Navigation data and search indexes are cached in Jotai atoms
- Auth tokens have TTL-based caching via the OIDC connector

## State Management Performance

### Jotai Best Practices

- Use `useAtomValue()` for read-only subscriptions — avoids unnecessary re-renders from write capabilities
- Use `useSetAtom()` for write-only — prevents subscribing to value changes
- Split large atoms into smaller, focused atoms to minimize re-render scope
- Prefer derived atoms (computed via `atom((get) => ...)`) over component-level computation

### Avoid

- Do not store derived/computed values as separate atoms if they can be computed from existing atoms
- Do not subscribe to atoms in components that only write to them
- Do not create atoms inside components — define them at module level

## Rendering Optimization

- Use `React.memo()` for components that receive stable props but sit under frequently-updating parents
- Use `useMemo()` for expensive computations that depend on specific inputs
- Use `useCallback()` for event handlers passed to memoized children
- Avoid inline object/array literals as props — they create new references on each render

## Debouncing Patterns

The repo uses consistent debouncing for expensive operations:

| Location | Delay | Purpose |
|----------|-------|---------|
| `src/components/Search/SearchInput.tsx` | 1000ms | Analytics tracking for search queries |
| `src/analytics/usePageEvent.ts` | 500ms | Segment page event tracking |
| `src/components/GlobalFilter/GlobalFilter.tsx` | 600ms | Tag loading API calls |

Follow the same pattern — debounce analytics and API calls, not UI interactions.

## Search Performance

- Search index uses Orama for in-memory full-text search
- Index loading is debounced (200ms) to avoid blocking
- Search results are boosted: title (10x), altTitle (5x), description (3x)
- Index state: `src/state/atoms/localSearchAtom.ts`

## Asset Handling

- Image loading uses a null loader in certain contexts (`config/image-null-loader.js`)
- PatternFly assets are resolved via custom `resolve-url-loader` configuration
- CSS modules and SCSS are extracted and minified in production
- PF5 legacy styles are still imported for compatibility — minimize new PF5 usage

## Module Preloading

- `src/chrome/preload-ui-module.ts` preloads Module Federation remotes on link hover via Scalprum's `preloadModule`
- Uses a `preloadCache` Map to prevent duplicate preload calls for the same route
- This improves perceived navigation speed without blocking initial load

## Memory Management

- Always clean up event listeners in `useEffect` return functions
- Use `isMounted` ref pattern to prevent state updates after unmount (see `SearchInput.tsx`)
- WebSocket connections must be cleaned up in `useChromeServiceEvents.ts` pattern
- History listeners must be unregistered (see `ScalprumRoot.tsx`)

## Dev Server Performance

- Dev server runs on port 1337 with hot module replacement
- `@pmmmwh/react-refresh-webpack-plugin` for fast React refresh
- `fork-ts-checker-webpack-plugin` runs type checking in a separate process
- Proxy configuration forwards API calls to stage environment

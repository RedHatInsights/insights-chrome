# Error Handling Guidelines

## Error Boundary Architecture

React error boundaries catch rendering errors and display fallback UI instead of crashing the entire application.

### Key Components

- `src/components/ErrorComponents/` — error page components (DefaultErrorComponent, GatewayErrorComponent, ErrorBoundary)
- Gateway errors are tracked via `gatewayErrorAtom` in `src/state/atoms/gatewayErrorAtom.ts`
- Error boundaries wrap at multiple levels: root app, individual routes, and module federation boundaries

### Error Boundary Placement

- **Root level:** Catches catastrophic failures in the chrome shell
- **Route level:** Each route has its own boundary so one app failure does not break others
- **Module Federation:** Each federated module loads inside a boundary — if a remote module fails to load, other apps remain functional

## Sentry Integration

Error reporting uses Sentry via `@sentry/webpack-plugin` and runtime integration.

### Configuration

- Sentry is **optional** — controlled by `ENABLE_SENTRY` environment variable
- Initialization: `src/utils/sentry.ts` — `initSentry()` with multiplexed transport and per-app DSN routing
- Session replay: 30% sample rate (100% on error)
- Traces sample rate: 0.1
- Breadcrumbs: 50 max
- Source maps are uploaded during build when `SOURCEMAPS=true`
- Debug mode: set `chrome:sentry:debug` in localStorage
- Error tracking documentation: `docs/errorHandling.md`

### Rules

- Do not catch and swallow errors silently — always report to Sentry or re-throw
- Use `console.error` for development debugging, but ensure Sentry captures production errors
- Add breadcrumbs for complex async flows to aid debugging

## Chunk Loading Errors

Dynamic imports and Module Federation can fail due to network issues or deployments.

### Patterns

- Chunk loading errors trigger a retry mechanism with a timeout flag
- `src/utils/common.ts` contains chunk refresh logic with a 10-second cooldown
- Failed chunk loads set a localStorage flag to prevent infinite reload loops
- After timeout, the error is shown to the user rather than retrying

### Handling Dynamic Imports

```typescript
// Use React.lazy with error boundaries
const MyComponent = React.lazy(() => import('./MyComponent'));

// Wrap in Suspense + ErrorBoundary
<ErrorBoundary>
  <Suspense fallback={<LoadingFallback />}>
    <MyComponent />
  </Suspense>
</ErrorBoundary>
```

## API Error Handling

### Authentication Errors

- 401 responses trigger automatic token refresh via the auth context
- `src/utils/responseInterceptors.ts` — `isTokenExpiredError()` triggers `auth.loginSilent()`, falls back to `auth.loginRedirect()`
- `src/components/ErrorComponents/ErrorBoundary.tsx` — `handleInvalidAuthState()` clears localStorage and forces hard reload on "No matching state found"
- `src/auth/OIDCConnector/OIDCUserManagerErrorBoundary.tsx` — handles "Session not active"/"Token not active" by redirecting to login
- Cross-tab auth errors use `broadcast-channel` to sync logout across tabs
- `src/auth/shouldReAuthScopes.ts` determines when scope re-auth is needed
- Gateway errors (3scale): `src/utils/responseInterceptors.ts` — `get3scaleError()` detects compliance blocks (OFAC, T5, EXPORT_CONTROL)

### Network Errors

- API calls should handle network failures gracefully
- Use loading states and error states in UI components
- Never show raw error messages to users — use PatternFly `EmptyState` components

### RBAC/Permission Errors

- 403 responses indicate missing permissions
- Show `NotEntitledModal` or appropriate access-denied UI
- Do not retry 403s — they require user/admin action

## Logging Patterns

### Console Logging

- Use `console.warn` for deprecated features or non-critical issues
- Use `console.error` for actual errors that need attention
- Avoid `console.log` in production code — ESLint may flag it
- Auth logger: `src/auth/logger.ts` for auth-specific debug logging

### Analytics Error Tracking

- Segment analytics track error events via `src/analytics/`
- Page errors, navigation failures, and auth errors are tracked
- Use `analytics.track()` for custom error events with context

## WebSocket Error Recovery

- `src/hooks/useChromeServiceEvents.ts` manages WebSocket connections
- Retry limit: 5 attempts with 2-second backoff on close/error
- Retries tracked via `useRef` — resets on successful connection
- After retry limit, connection is abandoned (no infinite retry loops)

## Silent Error Boundaries

- `src/components/Routes/SilentErrorBoundary.tsx` wraps non-critical components
- Returns `null` on error instead of showing error UI
- Use for optional UI elements where failure should not be visible to the user

## Offline Handling

- `src/auth/offline.ts` handles offline token scenarios
- Offline mode provides degraded functionality
- Token refresh failures in offline mode are handled gracefully without logout

## User-Facing Error States

Prefer PatternFly components for error UI:

- `EmptyState` with `EmptyStateIcon` for empty/error pages
- `Alert` for inline errors within forms or sections
- `Bullseye` for centered error messages
- Always provide actionable guidance (retry button, support link, etc.)

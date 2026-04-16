# Security Guidelines

## Authentication Abstraction Layer

All authentication goes through `ChromeAuthContext` (`src/auth/ChromeAuthContext.ts`). This is the single source of truth for auth state.

### Restricted Imports (ESLint-enforced)

These imports are **blocked by ESLint** and will fail CI:

```typescript
// NEVER do this:
import { useAuth } from 'react-oidc-context';        // BLOCKED
import { OidcClient } from 'oidc-client-ts';          // BLOCKED
import { something } from '**/cognito/*';              // BLOCKED
import { utils } from '**/OIDCConnector/utils';        // BLOCKED

// ALWAYS do this:
import { ChromeAuthContextValue } from '../auth/ChromeAuthContext';
// Or via the useChrome hook:
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
const { auth } = useChrome();
```

**Exception:** Only files inside `src/auth/OIDCConnector/` may import OIDC packages directly.

### Auth API Surface

Use `ChromeAuthContextValue` for auth operations:

| Method | Purpose |
|--------|---------|
| `getToken()` | Get current access token (async) |
| `getRefreshToken()` | Get refresh token (async) |
| `getUser()` | Get current user identity (async) |
| `login()` | Trigger login flow |
| `logout()` | Logout current tab |
| `logoutAllTabs()` | Broadcast logout across tabs |
| `reAuthWithScopes()` | Re-authenticate with additional scopes |
| `getOfflineToken()` | Get offline token for long-lived sessions |
| `forceRefresh()` | Force token refresh |

### Token Handling Rules

- Tokens are stored in memory (React context); refresh tokens use `WebStorageStateStore` (localStorage)
- Never store tokens in variables longer than the current function scope
- Never log tokens, even in debug mode
- Use `getToken()` fresh each time — do not cache token values
- Token expiry is tracked via `tokenExpires` on the auth context
- Cross-tab auth state uses `BroadcastChannel('auth')` in `src/auth/OIDCConnector/OIDCSecured.tsx` — syncs login/logout/refresh across tabs
- Silent token renewal: `src/auth/OIDCConnector/useManageSilentRenew.ts` auto-refreshes on visibility change and network online/offline events

### Cookie Security

- `src/auth/setCookie.ts` sets `cs_jwt` cookie for specific API paths (`/wss`, `/ws`, `/api/tasks/v1`, `/api/automation-hub`, etc.)
- Cookies use `secure=true` with expiry matching the JWT TTL
- Cross-account cookies: `src/auth/initializeAccessRequestCookies.ts` validates `CROSS_ACCESS_ACCOUNT_NUMBER` cookie expiry

### Global Auth Header Injection

`src/utils/iqeEnablement.ts` monkey-patches `window.fetch` and `XMLHttpRequest.send()` to automatically inject:
- `Authorization: Bearer <token>` header on requests to allowed origins
- `x-rh-frontend-origin: hcc` header

Allowed origins: `location.origin`, `api.openshift.com`, `/api/*` paths. This means **all API calls get auth headers automatically** — do not manually add auth headers.

## Authorization (RBAC)

Permissions are fetched via `src/auth/fetchPermissions.ts` using the RBAC API.

- Use `createFetchPermissionsWatcher()` to set up permission checks
- Permissions follow the format: `<application>:<resource>:<operation>` (e.g., `inventory:hosts:read`)
- Navigation visibility is permission-driven — see `src/utils/isNavItemVisible.ts`
- Wildcard permissions (`*`) are supported — see `docs/wildcard-permissions.md`

## Entitlements

User entitlements are checked via `src/auth/entitlementsApi.ts`.

- Entitlements determine which bundles/services a user can access
- The `NotEntitledModal` component (`src/components/NotEntitledModal/`) handles unauthorized access
- Check entitlements via `chrome.auth.getUser()` → `user.entitlements`

## Cross-Account Access

- `src/auth/crossAccountBouncer.ts` handles cross-account request validation
- Access request cookies are managed by `src/auth/initializeAccessRequestCookies.ts`
- `setCookie.ts` handles cookie operations with proper domain scoping

## Feature Flags

Feature flags use Unleash via `@unleash/proxy-client-react`:

- Flags are evaluated client-side against the Unleash proxy
- Component: `src/components/FeatureFlags/`
- Do not hardcode feature flag values — always check at runtime
- Prefer `useFlag()` hook from `@unleash/proxy-client-react`

## Environment Detection

Use utility functions from `src/utils/common.ts`:

- `getEnv()` — returns current environment identifier
- `isProd()` — check if running in production
- `ITLess()` — check if running in IT-less mode
- Never hardcode environment-specific URLs — use `getEnvDetails()`

## SSO Configuration

SSO endpoints are environment-specific:

- Production: `sso.redhat.com`
- Stage: `sso.stage.redhat.com`
- Managed via `src/auth/platformUrl.ts` — use `getInitialScope()` (from `src/auth/getInitialScope.ts`) for scope resolution

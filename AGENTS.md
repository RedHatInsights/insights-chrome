# AI Agent Guide for insights-chrome

> **This is the most critical repository in the Red Hat Hybrid Cloud Console platform.**
> Any breakage can take down the entire product. Test thoroughly. Never skip tests. Never take shortcuts.

## What This Repo Is

insights-chrome is the micro-frontend platform shell for the Hybrid Cloud Console (HCC). It provides the standard header, navigation, authentication, state management, search, analytics, and Module Federation host for **50+ consuming applications**. Every HCC app runs inside this shell.

## Documentation Index

Detailed domain-specific guidelines for AI agents:

| File | Domain |
|------|--------|
| [docs/security-guidelines.md](docs/security-guidelines.md) | Authentication, authorization, token handling, RBAC, feature flags |
| [docs/testing-guidelines.md](docs/testing-guidelines.md) | Jest, Cypress, Playwright, coverage requirements, mocking patterns |
| [docs/error-handling-guidelines.md](docs/error-handling-guidelines.md) | Error boundaries, Sentry, chunk loading, graceful degradation |
| [docs/integration-guidelines.md](docs/integration-guidelines.md) | Module Federation, Scalprum, Chrome API, WebSocket, analytics |
| [docs/performance-guidelines.md](docs/performance-guidelines.md) | Code splitting, caching, bundle optimization, Jotai patterns |

Existing documentation for deeper reference:

| File | Topic |
|------|-------|
| [docs/api.md](docs/api.md) | Chrome JavaScript API specification |
| [docs/navigation.md](docs/navigation.md) | Navigation configuration system |
| [docs/auth.md](docs/auth.md) | Authentication architecture |
| [docs/analytics.md](docs/analytics.md) | Analytics integration |
| [docs/errorHandling.md](docs/errorHandling.md) | Sentry error handling |
| [docs/localSearchDevelopment.md](docs/localSearchDevelopment.md) | Search implementation |
| [docs/wsSubscription.md](docs/wsSubscription.md) | WebSocket subscriptions |
| [docs/wildcard-permissions.md](docs/wildcard-permissions.md) | Wildcard permission handling |

## Project Structure

```
src/
  @types/          # TypeScript type definitions (types.d.ts is the main file)
  analytics/       # Segment, Amplitude, DPAL analytics providers
  auth/            # Authentication layer (ChromeAuthContext, OIDC, RBAC, entitlements)
    OIDCConnector/ # ONLY place allowed to import oidc-client-ts / react-oidc-context
  chrome/          # Chrome API surface (create-chrome.ts — BREAKING CHANGE RISK)
  components/      # React components (33 feature directories)
    ErrorComponents/   # Error boundaries and error pages
    FavoriteServices/  # Exposed via Module Federation
    GlobalFilter/      # Cross-app global filtering
    Header/            # Platform header
    Navigation/        # Left navigation
    Search/            # Search UI
    RootApp/           # App entry point, Scalprum setup
  hooks/           # Custom React hooks (22 hooks)
  layouts/         # Page layouts (SatelliteToken exposed via MF)
  state/
    atoms/         # Jotai atoms (27 atoms — the state management layer)
    stores/        # Scalprum shared stores (limited use)
    chromeStore.ts # Central Jotai store
  utils/           # Utility functions
config/            # Webpack, Jest, ESLint configuration
cypress/           # Cypress component and E2E tests
playwright/        # Playwright E2E tests
.tekton/           # Konflux/Tekton CI/CD pipelines
build-tools/       # Dockerfile and build utilities
docs/              # Documentation (you are here)
```

## Core Technology Stack

- **React 18** with **TypeScript 5.9** (strict mode)
- **Webpack 5** with **Module Federation**
- **SWC** for transpilation (fast builds)
- **Jotai 2** for atomic state management (NOT Redux)
- **PatternFly 6** for UI components (PF5 legacy styles still imported)
- **React Router v6** for routing
- **Scalprum** for Module Federation orchestration
- **OIDC** (`oidc-client-ts` + `react-oidc-context`) for authentication

## Cross-Cutting Conventions

### TypeScript

- **All new code must be TypeScript** — no JavaScript files for new features
- Strict mode is enforced: `noImplicitAny: true`, `strict: true`
- Prefer explicit types over `any` — ESLint warns on `@typescript-eslint/no-explicit-any`
- Type definitions live in `src/@types/types.d.ts`
- Imports must be sorted (`sort-imports` ESLint rule with `ignoreDeclarationSort: true`)

### Naming Conventions

| Kind | Convention | Example |
|------|-----------|---------|
| Components | PascalCase directory + file | `Navigation/Navigation.tsx` |
| Hooks | camelCase with `use` prefix | `useChrome`, `useBundle` |
| Utilities | camelCase | `getEnv`, `flatTags` |
| Jotai atoms | camelCase with `Atom` suffix | `activeModuleAtom`, `globalFilterAtom` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_SSO_ROUTES`, `LOGIN_SCOPES_STORAGE_KEY` |
| Test files | Same name + `.test.ts(x)` or `.cy.tsx` | `Navigation.test.tsx`, `Navigation.cy.tsx` |

### File Organization

- Feature-based folders with `index.ts` barrel exports
- Test files next to source files (not in a separate `__tests__/` tree)
- One component per file (exception: small helper components used only by the parent)

### State Management

- **Use Jotai atoms** for all new state — not Redux, not Context (unless auth-related)
- Atom definitions in `src/state/atoms/`
- Central store: `src/state/chromeStore.ts`
- Use `useAtomValue` (read), `useSetAtom` (write), `useAtom` (both)
- Define atoms at module level, never inside components

### Authentication

- **Always use ChromeAuthContext** — direct OIDC imports are ESLint-blocked
- Only `src/auth/OIDCConnector/` may import from `react-oidc-context` or `oidc-client-ts`
- For app-level auth, use `useChrome().auth`

### UI Components

- Use **PatternFly 6** (`@patternfly/react-core`) for all new UI
- Use `ChromeLink` for internal navigation (not `<a>` or `<Link>`)
- Avoid inline styles — use SCSS modules or PatternFly utility classes
- Do not import PropTypes — use TypeScript types

## Common Pitfalls

1. **Module Federation version conflicts** — Shared singletons must version-match across all consuming apps. Bumping `react` or `@patternfly/*` is a breaking change.
2. **`create-chrome.ts` changes** — This file IS the public API. Changes here affect 50+ apps. Requires `breaking-change` label and migration docs.
3. **Navigation `sortedLinks` field** — The `Navigation` type requires `sortedLinks: string[]`. Omitting it in test fixtures causes TS2741 CI failures.
4. **Jest OOM** — This repo can hit memory limits during tests. Use `--maxWorkers=1` if needed.
5. **Auth restricted imports** — ESLint blocks `react-oidc-context` and `oidc-client-ts` outside `src/auth/OIDCConnector/`. The build will fail.
6. **PF5 vs PF6** — PF5 styles are still imported for backward compatibility. Prefer PF6 for new code but do not remove PF5 imports.
7. **Environment-specific URLs** — Never hardcode URLs. Use `getEnv()`, `isProd()`, `getEnvDetails()` from `src/utils/common.ts`.
8. **Global filter side effects** — `globalFilterAtom` changes propagate to ALL consuming applications. Test thoroughly.

## Build & Run Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server at https://stage.foo.redhat.com:1337
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Jest unit tests
npm run test:ct      # Cypress component tests
npm run playwright   # Playwright E2E tests
npm run verify       # Full verification: lint + build + test
npm run analyze      # Bundle analyzer
```

## CI/CD

- **GitHub Actions** (`.github/workflows/test.yml`): lint, unit tests, Cypress, build, Playwright
- **Konflux/Tekton** (`.tekton/`): container builds, SBOM, enterprise contract checks
- Node version: `22.19.0`
- PR images expire after 5 days
- Default branch: `master`

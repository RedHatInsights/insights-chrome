# Integration Guidelines

## Module Federation Architecture

insights-chrome is the **host application** for the entire Hybrid Cloud Console. It uses Webpack 5 Module Federation to dynamically load consuming applications at runtime.

### Federation Configuration

- Config: `config/webpack.plugins.js`
- Module name: `chrome`
- Filename: `chrome.[contenthash].js` (production), `chrome.js` (dev)

### Exposed Modules

Chrome exposes these modules for consuming apps:

| Module Path | Source File | Purpose |
|-------------|-----------|---------|
| `./LandingNavFavorites` | `src/components/FavoriteServices/LandingNavFavorites.tsx` | Landing page favorites |
| `./DashboardFavorites` | `src/components/FavoriteServices/DashboardFavorites.tsx` | Dashboard favorites widget |
| `./SatelliteToken` | `src/layouts/SatelliteToken.tsx` | Satellite token layout |
| `./ModularInventory` | `src/inventoryPoc/index.ts` | Modular inventory POC |
| `./search/useSearch` | `src/hooks/useSearch.ts` | Search hook for apps |
| `./analytics/intercom/OpenShiftItercom` | `src/components/OpenShiftIntercom/OpenShiftIntercomModule.tsx` | Intercom module component |
| `./analytics/intercom/useOpenShiftIntercomStore` | `src/state/stores/openShiftIntercomStore.ts` | Intercom state store |

### Shared Dependencies (Singletons)

These packages are shared as **singletons** — version mismatches cause silent failures:

- `react`, `react-dom` (eager, singleton)
- `react-intl` (eager, singleton)
- `react-router-dom` (singleton)
- `@scalprum/core`, `@scalprum/react-core` (singleton)
- `@patternfly/quickstarts` (singleton)
- `@redhat-cloud-services/chrome` (singleton)
- `@unleash/proxy-client-react` (singleton)
- `@openshift/dynamic-plugin-sdk` (singleton)

**Rule:** When updating any shared dependency version, check that all consuming apps are compatible. Version bumps to shared singletons are **breaking changes**.

### Dynamic Modules

`config/get-dynamic-modules.js` dynamically discovers and shares `@patternfly/react-core` and `@patternfly/react-icons` components from `node_modules` at build time. This ensures PatternFly components are shared as singletons across all consuming apps without manual enumeration.

## Scalprum Integration

[Scalprum](https://github.com/scalprum/scaffolding) is the Module Federation wrapper that handles:

- Dynamic remote module loading
- Module registry and lifecycle
- Error boundaries for remote modules

### Key Files

- `src/components/RootApp/ScalprumRoot.tsx` — sets up Scalprum provider
- `src/state/atoms/chromeModuleAtom.ts` — tracks registered modules via `RegisterModulePayload`

### Registering Modules

Apps register with Chrome via the `registerModule` function on the Chrome API:

```typescript
const chrome = useChrome();
chrome.registerModule('my-app');
```

## Chrome API (create-chrome.ts)

`src/chrome/create-chrome.ts` assembles the Chrome API surface that consuming apps access via `useChrome()`.

### Breaking Change Protocol

Changes to `create-chrome.ts` affect **50+ consuming applications**. Requirements:

1. Add `breaking-change` label to the PR
2. Write migration documentation
3. Coordinate with consuming app teams
4. CodeRabbit enforces this — PRs modifying this file without the label will be flagged

## WebSocket Integration

- `src/hooks/useChromeServiceEvents.ts` manages WebSocket connections to chrome-service-backend
- URL: `wss://{origin}/wss/chrome-service/v1/ws` with CloudEvents sub-protocol
- Event types include `com.redhat.console.notifications.drawer`
- Apps subscribe via `chrome.addWsEventListener(type, callback)`
- Auto-reconnect: 5 retry limit with 2-second backoff on close/error
- Documentation: `docs/wsSubscription.md`

## Cross-App Communication

### Event System

Chrome maintains a `PUBLIC_EVENTS` registry (e.g., `GLOBAL_FILTER_UPDATE`). Apps subscribe via:

```typescript
const unsubscribe = chrome.on('GLOBAL_FILTER_UPDATE', ({ data }) => {
  const tags = chrome.mapGlobalFilter?.(data);
});
```

### Navigation Listeners

Apps can listen for navigation changes via `addNavListener` / `deleteNavListener` atoms in `src/state/atoms/activeAppAtom.ts`. These fire `APP_NAVIGATION` events when the active app changes.

## Navigation System

- Navigation config is loaded dynamically from chrome-service-backend
- `src/utils/fetchNavigationFiles.ts` fetches nav data
- `src/state/atoms/navigationAtom.ts` manages nav state
- Navigation items are permission-filtered via `src/utils/isNavItemVisible.ts`
- `ChromeLink` component (`src/components/ChromeLink/`) handles internal routing — always use it over `<a>` tags for internal links
- Documentation: `docs/navigation.md`

## Frontend Operator (FEO) Integration

The Frontend Operator manages service discovery and routing in OpenShift:

- `src/hooks/useFeoConfig.ts` — checks `platform.chrome.consume-feo` feature flag
- FEO provides `fed-mods.json` manifest for Module Federation remotes
- CRD definition: `frontend.yml` at repo root defines the Frontend resource (manifestLocation, modules, routes, API versions)
- When FEO is enabled, navigation bundles are fetched from FEO-generated data instead of static config
- Chrome adapts its behavior based on whether FEO is present

## Analytics Integration Points

Multiple analytics services are integrated:

| Service | Purpose | Module |
|---------|---------|--------|
| Segment | Event tracking | `src/analytics/SegmentProvider.tsx` |
| Amplitude | Product analytics | `src/analytics/useAmplitude.ts` |
| Pendo | Product guidance | Initialized via Chrome |
| Sentry | Error tracking | Webpack plugin + runtime |
| DPAL | Data analytics | `src/analytics/useDpal.ts` |
| Intercom | Support chat | `src/components/OpenShiftIntercom/` |

### Rules

- Always use the provided hooks/providers — never initialize analytics directly
- Analytics are disabled in non-production by default
- User consent and data privacy rules apply — check before adding new tracking

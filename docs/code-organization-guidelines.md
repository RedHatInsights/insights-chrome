# Code Organization Guidelines

## Entry Point

Boot order is fixed. Do not invent a second root or skip providers:

```text
src/index.ts
  → src/bootstrap.tsx          # Jotai, Intl, error boundary, OIDC
    → src/components/RootApp/RootApp.tsx
      → src/components/RootApp/ScalprumRoot.tsx  # Module Federation host
```

Shared types live in `src/@types/types.d.ts`. Utility types may come from the `utility-types` package.

## New Files

| Kind      | Location                           | Tests                                                                                                          |
| --------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Component | `src/components/<Name>/<Name>.tsx` | `src/components/<Name>/<Name>.test.tsx` and, for interactive UI, `cypress/component/<Name>.cy.tsx`             |
| Hook      | `src/hooks/use<Name>.ts`           | `src/hooks/use<Name>.test.ts` next to the source (there is no `src/hooks/index.ts` barrel)                     |
| Atom      | `src/state/atoms/<name>Atom.ts`    | `src/state/atoms/<name>Atom.test.ts`; seed `src/state/chromeStore.ts` only when the atom needs a store default |

Keep one primary component per file. Small helpers used only by that parent may live beside it. Prefer a feature folder; add an `index.ts` barrel only when several files are imported from outside the folder.

ESLint config is `eslint.config.js` (`@redhat-cloud-services/eslint-config-redhat-cloud-services` + `@typescript-eslint`). Imports must satisfy `sort-imports` with `ignoreDeclarationSort: true`.

## Chrome and UI

- Set page titles through `chrome.updateDocumentTitle()` / `updateDocumentTitle` in `src/utils/common.ts`. Do not assign `document.title` directly.
- Internal routes use `ChromeLink` (`src/components/ChromeLink/`), not raw `<a>` or react-router `<Link>`.
- New UI uses PatternFly 6 (`@patternfly/react-core`) and design tokens. Prefer SCSS modules or PatternFly utilities over inline styles. PF5 styles stay imported for compatibility — do not delete those imports.
- Do not add PropTypes; use TypeScript types.

## Analytics Events

Track through `useSegment()` from `src/analytics/useSegment.ts` (backed by `src/analytics/SegmentProvider.tsx`). Do not initialize Segment, Amplitude, Pendo, or Sentry ad hoc. Document new events in `docs/analytics.md`.

## Local App Proxy

`LOCAL_APPS` rewrites Module Federation remotes to a developer machine. Syntax and examples: README.md (“Working with local applications”).

```bash
LOCAL_APPS=frontend-starter-app:8003 npm run dev
```

## Verification

```bash
npm run lint          # ESLint, including import order and restricted OIDC imports
npm run lint:js:fix   # Auto-fix where safe
npm run verify        # lint + CRD validate + build + unit tests
```

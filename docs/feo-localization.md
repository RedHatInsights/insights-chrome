# FEO configuration localization

Chrome overlays FEO text using `languageAtom`, the existing effective rendering
locale. The language-detection and consume-FEO flags retain their existing roles;
legacy navigation and search entries are not translated.

## Asset contract

The publisher serves these files beside the generated base JSON under
`/api/chrome-service/v1/static/`:

- `locales.json`: `[{ "id": "fr", "name": "Français", "file": "messages.fr.json" }]`
  (an English entry may omit `file`).
- `messages.<locale>.json`: a flat object of runtime message keys to strings.

Chrome requests only the exact effective locale when advertised. Manifest file
names must match `messages.<id>.json`; arbitrary URLs and paths are rejected.
Missing files, malformed payloads, missing/empty keys, and unadvertised locales
render English. A pending locale change also renders English, not the previous
language. Late responses cannot replace the current selection. Failed requests,
invalid manifests and malformed catalog values emit warning-level Sentry events
with asset and `feo-localization` tags; English fallback does not hide faults.
Unadvertised locales and missing translation keys are expected fallback, not
reported faults.

Navigation uses the operator's `i18nKey` metadata, including after routes are
normalized to navItems. Tiles use frontend/section/group/id, search uses its
runtime id, and environment labels use bundle/category/group ids. Only supported
text fields are overlaid; URLs, permissions, visibility, ids and the English
source objects are unchanged. Search aliases use one slug-keyed message per
English alias; pipes have no special meaning.

Search indexes are rebuilt per catalog change with localized display text and
both localized and English terms. An untranslated search entry retains its exact
English index terms, including its original alias list. Remote-inserted entries
update the live index without rebuilding it or suspending consumers; a per-store
registry replays them into future locale builds. Query caches are per index and
invalidated on API inserts. Open search queries rerun when the index changes.

The index tokenizes with `Intl.Segmenter` rather than Orama's English default,
which drops Chinese, Japanese and Korean text. Latin accents are folded
("roles" finds "Rôles") and French elisions are also indexed by their parts
("ensemble" finds "Vue d’ensemble"). See `src/utils/searchTokenizer.ts`.

`searchAPI.query()` and `searchAPI.insert()` retain their asynchronous signatures
and use the current locale index, awaiting its initial build if necessary. They
no longer query a partially initialized singleton while service assets load.
This readiness change also applies to remote API callers. Invalid remote entries
are reported without admitting them into future locale builds.

Navigation-derived document titles update without a page reload. If existing
breadcrumbs already render a module's `defaultDocumentTitle`, its module message
can overlay that text. Routes without breadcrumbs retain their existing title;
localization introduces no new document-title fallback.

## Integration boundaries

Language selection belongs to the SSO account console under ADR-093, not a
Chrome-owned picker.
`advertisedFeoLocalesAtom` exposes the publisher's locale list, including native
names; the consumer uses it to gate locale-file requests, not to resolve or save
the user's preference.

The operator generates these assets from Frontend/FrontendEnvironment locale
maps. Locale-aware S3 publication is the target delivery mechanism; interim
chrome-service serving is only an alternative if S3 delivery is unavailable.
Generation alone does not guarantee HTTP delivery. A deployment must expose the
manifest and catalogs at the static URLs above; without them Chrome falls back
to English. Verify delivery in the target environment rather than inferring it
from publisher ticket states.

Jest tests and `cypress/component/FeoLocalization.cy.tsx` change the existing
locale atom in place and verify navigation, tiles, open search results and
document-title updates without reloading. The browser tests use the production
initializer, components, HTTP asset loader and search index, with fixture API
responses. They also cover a delayed previous-locale response. Live SSO switching
and end-to-end publication are not demonstrated by these isolated tests.

## Fixtures

`testdata/feo-localization/{bundles,locales,messages.fr,messages.ja}.json` are copied
from frontend-operator's `tests/fixtures/localization` at commit
`747a445a869c6520a4f9e4ac6ea62da21010c59c`. Preserve these shared runtime keys when
updating either publisher or consumer. The commit is fixture provenance, not a
claim about the deployed publisher version.

The operator does not supply generated search-index or service-tiles fixtures.
Those test inputs are hand-authored using keys in the shared French catalog, so
these tests exercise consumer mapping but do not prove generated search/tile
payload parity. The shared Japanese catalog is empty; the delayed-response
browser test uses distinct synthetic Japanese messages to distinguish stale
French results from both Japanese and English fallback.

Issue: https://issues.redhat.com/browse/RHCLOUD-52084

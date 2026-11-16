# Hydra search (POC)

Proof of concept for [ADR-094](https://github.com/RedHatInsights/architecture/blob/main/adr/ADR-094-adopt-common-search-backend-for-console-search.md): service search queries the Red Hat common search backend (Solr behind Hydra) instead of the in-browser Orama index.

The POC is behind the `platform.chrome.search.hydra` Unleash flag and is **off by default**.

## How it works

| Piece                                                                                                                                                                              | File                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Hydra client: query building, response mapping, sanitizing, permission filtering, timeout                                                                                          | `src/utils/hydraSearch.ts`              |
| Picks Hydra or local Orama (no fallback: Hydra errors show the empty state)                                                                                                        | `src/utils/consoleSearch.ts`            |
| Masthead search (200 ms debounce in Hydra mode, aborts stale requests, keeps the last successful results on screen until the next success, placeholder "default state" when empty) | `src/components/Search/SearchInput.tsx` |
| Federated `useChrome().search.query` / `./search/useSearch`                                                                                                                        | `src/utils/searchAPI.ts`                |

Request:

```
GET https://access[.stage].redhat.com/hydra/rest/search/platform/portal
    ?q=allTitle:(<tokens>)^10 OR alt_titles:(<tokens>)^5 OR abstract:(<tokens>)^3
    &fq=documentKind:ModuleDefinition
    &rows=25&hl=true&hl.fl=allTitle,abstract&hl.simple.pre=<mark>&hl.simple.post=</mark>
X-User-Agent: insights-chrome/<release> (<host>)
```

- Each token matches exactly, as a prefix (`inv*`) or, for 4+ characters, fuzzily (`inventory~1`). All tokens must match.
- `redhat_client` and `clientName` are deprecated and are not sent.
- No `X-API-Key` is sent. A key must never ship in browser code (Search API docs). If the search team requires a key, the query has to go through a backend proxy (e.g. chrome-service).
- CORS on Hydra allows `https://console.redhat.com` with the `x-api-key` and `x-user-agent` headers.
- The console documents are the ones chrome-service uploads (`cmd/search/publishSearchIndex.go` → `POST /hydra/rest/search/console/index`). They are served from the **portal** source. `/hydra/rest/search/platform/console` returns `400 Invalid search path`.

### Document fields

| Hydra field                          | Chrome field                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `allTitle` (`"<title> \| <bundle>"`) | `title` (text before `\|`)                                                                |
| `bundle_title[0]`                    | `bundleTitle` (falls back to chrome's bundle mapping, or the hostname for external links) |
| `abstract`                           | `description`                                                                             |
| `relative_uri`                       | `pathname` (`isExternal` for http(s) URLs; other schemes and `//host` links are dropped)  |
| `highlighting[uri]`                  | highlighted `title` / `description` (sanitized to bare `<mark>`)                          |

Results are de-duplicated by `pathname`, because the index holds several documents per page.

### Permissions

Solr does not store nav `permissions`. Hydra document ids are identical to the ids in the local legacy index (`hcc-module-<href>-<id>`, both produced by chrome-service). Results are filtered with the permissions loaded with the local index, using the same `evaluateVisibility` cache as local search. All 6 permission-gated entries in the prod local index are present in Hydra.

## Trying it

```js
// enable for this browser, overriding Unleash (use 'false' to force local search)
localStorage.setItem('chrome:search:hydra', 'true');
// optional: point at another endpoint (must be an https redhat.com URL)
localStorage.setItem('chrome:search:hydra:url', 'https://access.redhat.com/hydra/rest/search/platform/portal');
```

Then reload and use "Search for services". The `chrome.search-query` analytics event includes `source: 'hydra' | 'local'`.

- In local dev (`npm run dev`, `*.foo.redhat.com`) chrome calls `/hydra/rest/search/...` on its own origin. The webpack dev server forwards it to `access.stage.redhat.com` through `squid.corp.redhat.com:3128` (override with `HYDRA_PROXY_URL`), as it does for the rest of console stage. Restart the dev server after pulling this change.
  - Why: a browser that is not on the corp proxy gets Akamai's "Preprod Lockdown" page from `access.stage.redhat.com`. It answers the CORS preflight with a `403`, which the browser reports as a CORS error. Hydra's own CORS config allows `stage.foo.redhat.com:1337`, `console.stage.redhat.com` and `console.redhat.com`.
- Prod (`access.redhat.com`) is reachable without VPN.
- Command-line check against stage: `curl -x http://squid.corp.redhat.com:3128 'https://access.stage.redhat.com/hydra/rest/search/platform/portal?q=inventory&fq=documentKind:ModuleDefinition&rows=3'`

## Open questions before going past POC

1. **Index freshness.** Stage documents were last indexed 2026-08-26 and prod 2026-07-23. The chrome-service uploader works, but only runs on pod start (ADR-094 moves it to frontend-operator).
2. **Index coverage.** Hydra has 160 documents in prod. They come from chrome-service's legacy static files only, so frontend-operator `searchEntries` (`search-index-generated.json`) are not searchable until the operator upload lands.
3. **Path and source.** Confirm with the search team (cpsearch@redhat.com, `#team-uie-ixd-search`) that `platform/portal` + `documentKind:ModuleDefinition` is the supported read path for console, or whether a dedicated `console` source should be registered.
4. **API key.** Decide whether console search needs an `X-API-Key`. If so, add a chrome-service proxy.
5. **Preview vs stable.** One index serves both. `env` only affects the client cache today.
6. **Runtime inserts.** `useChrome().search.insert()` still writes only to the local index. Those entries are not returned in Hydra mode.
7. **Latency.** Measured from a dev machine on 2026-11-15 with chrome's query: 0.56–1.3 s per warm query on prod, and 1.7–3.7 s for a cold first request. The 3 s timeout can trip on a cold first query, which then shows no results. Ask the search team about expected latency, and consider pre-warming the connection when the search input is focused.
8. **Relevance tuning.** Typo tolerance is weaker than Orama: `invnetory` returns 1 result vs 15 for `inven`. Tune with the search team (e.g. `edismax`, `qf`/`pf`, spellcheck collations, which Hydra already returns).
9. **Startup cost.** The local Orama index still loads at startup. Hydra mode needs it only for the nav permissions used to filter results, so load just the permissions (or move permission data into the index) and skip building Orama.

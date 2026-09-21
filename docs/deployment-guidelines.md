# Deployment Guidelines

Chrome ships through GitHub Actions (PR quality) and Konflux/Tekton (container images). Node version is `.nvmrc` — match it locally and in CI.

## GitHub Actions

Workflow: `.github/workflows/test.yml` on push/PR to `master`.

Order: install (npm cache) → Jest + Codecov, ESLint, Cypress component tests, and production webpack build as parallel jobs. The GitHub Actions workflow does not run Playwright.

`npm run verify` is the local stand-in for the lint/build/unit slice (`lint` + `validate:crd` + `build` + `test`). It does not run Cypress or Playwright.

## Konflux / Tekton

Pipelines live in `.tekton/` (`tekton.dev/v1` PipelineRuns unless noted). Application `chrome-frontend`, component `insights-chrome`, namespace `hcc-platex-services-tenant`. Image build uses `build-tools/Dockerfile`.

| File | When it runs |
|------|----------------|
| `insights-chrome-push.yaml` / `insights-chrome-pull-request.yaml` | Production image on `master` push / PR |
| `insights-chrome-dev-push.yaml` / `insights-chrome-dev-pull-request.yaml` | Dev environment |
| `insights-chrome-sc-push.yaml` / `insights-chrome-sc-pull-request.yaml` | Stage (`chrome-frontend-sc` image path) |
| `run-tests-task.yml` | Custom task for ephemeral-environment tests (`tekton.dev/v1beta1`) |
| `platform-infra-tests-pipeline.yaml` | Scheduled platform infra smoke test |

Triggers use `pipelinesascode.tekton.dev/on-cel-expression` (example: `event == "push" && target_branch == "master"`). Retention is `pipelinesascode.tekton.dev/max-keep-runs: "3"`.

Image tags:

- Push: `quay.io/redhat-user-workloads/hcc-platex-services-tenant/insights-chrome:{{revision}}`
- PR: `:on-pr-{{revision}}` (expires after 5 days)
- Dev/stage files use the matching `insights-chrome-dev` / `chrome-frontend-sc/insights-chrome-sc` repository names — do not copy the prod image URL into those files.

Tasks come from `quay.io/konflux-ci/tekton-catalog` bundles (`git-clone-oci-ta`, `buildah`, `show-sbom`, `summary`). Adding unsigned/untrusted tasks fails Enterprise Contract (`trusted_task.trusted`).

When editing `.tekton/`:

- Preserve CEL expressions, `max-keep-runs`, dockerfile path, and per-environment `output-image` values unless the change is intentional.
- Prefer catalog task bumps over inlining scripts.
- `run-tests-task.yml` still uses the v1beta1 Task API — do not silently convert it without checking Konflux support.

## CodeRabbit

Config: `.coderabbit.yaml`. Pre-merge checks that block or warn:

| Check | Mode | Implication |
|-------|------|-------------|
| Tests Required | error | Behavior changes under `src/**/*.{ts,tsx,js,jsx}` need relevant test evidence (skip docs-only and dependency-only PRs) |
| TypeScript Strict Mode | warning | No unexplained `any` |
| Auth Abstraction Layer | error | No direct OIDC imports outside `src/auth/OIDCConnector/` |
| Chrome API Breaking Changes | error | `src/chrome/create-chrome.ts` needs `breaking-change` + migration notes |
| Module Federation Compatibility | warning | Shared singleton / exposed-module changes |

Dependabot, Renovate, and `github-actions[bot]` are excluded from review. Guideline files under `docs/*-guidelines.md` are the CodeRabbit knowledge base for these rules.

## Verification

```bash
npm run verify                          # lint, CRD, webpack build, unit tests
ls .tekton/*.yaml .tekton/*.yml         # pipeline files present
node -v && cat .nvmrc                   # local Node matches CI
```

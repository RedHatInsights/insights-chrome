# Debugging Chrome Locally

Enable localStorage-backed flags from the browser console via `insights.chrome.enable.<name>()`. Each call returns a function that turns that flag off. `degradedStateBanner` is Jotai state, not localStorage.

Source of flags: `src/utils/debugFunctions.ts`.

## Common flags

| Function              | Purpose                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `iqe`                 | QE helpers                                                               |
| `jwtDebug`            | JWT / auth debug logging (`chrome:auth:debug`)                           |
| `forcePendo`          | Force Pendo initialization                                               |
| `segmentDev`          | Use the Segment dev write path                                           |
| `intlDebug`           | Show missing translation keys                                            |
| `sentryDebug`         | Sentry debug (`chrome:sentry:debug`)                                     |
| `appFilter`           | Experimental app filter                                                  |
| `globalFilter`        | Experimental global filter                                               |
| `shortSession`        | Short JWT session for logout testing                                     |
| `degradedStateBanner` | Force the user-personalization degraded banner (Jotai, not localStorage) |
| `invTags`             | Enable experimental inventory tags                                       |
| `remediationsDebug`   | Enable Remediations debug buttons                                        |

Example: `const off = insights.chrome.enable.iqe()` then `off()` to disable.

## Troubleshooting

**Module Federation**

- Manifest: `/apps/chrome/js/fed-mods.json` (or the FEO-generated manifest location when `platform.chrome.consume-feo` is on)
- Shared singleton version mismatch fails silently — check the browser console for remote load errors
- See [integration-guidelines.md](./integration-guidelines.md)

**Authentication**

- Inspect tokens only in memory / the auth context — do not log them
- Enable `jwtDebug` and confirm SSO resolution from `src/utils/common.ts` matches the environment
- See [security-guidelines.md](./security-guidelines.md)

**Build**

- Delete `.webpack-cache/` and re-run `npm install` after corrupt or stuck builds
- Confirm TypeScript errors with `npm run build`

**Tests**

- Snapshots: `npm run test:update`
- Mocks: `config/setupTests.js`
- Jest OOM / jsdom URL: [testing-guidelines.md](./testing-guidelines.md)

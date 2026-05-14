# Testing Chrome Source Map Multi-Project Upload

This guide helps you test that Chrome source maps are being uploaded to all Insights app Sentry projects.

## Prerequisites

1. **Sentry Auth Token**: Get a Sentry auth token for the `red-hat-it` organization
   - Go to https://us.sentry.io/settings/account/api/auth-tokens/
   - Create a token with `project:write` scope
   - Save the token securely

2. **Environment Variables**: Set these before building:
   ```bash
   export ENABLE_SENTRY=true
   export SENTRY_AUTH_TOKEN=<your-token-here>
   export SENTRY_RELEASE=chrome-test-$(date +%s)
   ```

## Test 1: Local Build with Source Map Upload

Build Chrome locally and verify source maps upload to all projects:

```bash
cd /path/to/insights-chrome

# Set environment variables
export ENABLE_SENTRY=true
export SENTRY_AUTH_TOKEN=<your-token-here>
export SENTRY_RELEASE=chrome-test-$(date +%s)

# Build Chrome
npm run build

# Watch the output for source map upload logs
# You should see uploads to ALL projects in CHROME_SENTRY_PROJECTS:
# - advisor-rhel
# - compliance-rhel
# - dashboard-rhel
# - inventory-rhel
# - etc.
```

### Expected Output

Look for lines like:
```
> Uploading sourcemaps to Sentry...
✓ Successfully uploaded source maps to advisor-rhel
✓ Successfully uploaded source maps to compliance-rhel
✓ Successfully uploaded source maps to dashboard-rhel
...
```

### Verification

1. Go to Sentry: https://us.sentry.io/organizations/red-hat-it/
2. For each project in the list, check:
   - Navigate to Settings → Source Maps
   - Find your release (chrome-test-XXXXXXXXXX)
   - Verify source maps exist for Chrome files

## Test 2: Verify Source Maps Work in Error Stack Traces

After deploying Chrome with source maps, test that stack traces are readable:

### Trigger a Test Error

1. **In Inventory App**:
   ```javascript
   // Add this to a Chrome component temporarily
   console.error('Test error from Chrome code');
   throw new Error('Chrome source map test error');
   ```

2. **Navigate to Inventory** and trigger the error

3. **Check Sentry**:
   - Go to inventory-rhel project
   - Find the error
   - Verify stack trace shows **readable Chrome source code** (not minified)

### What Success Looks Like

**❌ Before Fix (Minified)**:
```
Error: Chrome source map test error
  at e.render (chrome-root.abc123.js:1:2345)
  at t.componentDidMount (chrome-root.abc123.js:5:6789)
```

**✅ After Fix (Readable)**:
```
Error: Chrome source map test error
  at ChromeComponent.render (src/components/ChromeComponent.tsx:42:10)
  at ChromeApp.componentDidMount (src/App.tsx:128:5)
```

## Test 3: Verify Across Multiple Apps

Repeat Test 2 for multiple apps to ensure source maps work everywhere:

- [ ] inventory-rhel
- [ ] compliance-rhel  
- [ ] vulnerability-rhel
- [ ] advisor-rhel

Each app should show readable Chrome stack traces.

## Test 4: Build Time Impact

Measure if uploading to multiple projects significantly increases build time:

```bash
# Before (single project)
time npm run build  # Note the time

# After (multi-project with this fix)
time npm run build  # Compare the time

# Expected: 10-30 second increase (uploads run in parallel)
```

## Common Issues

### Issue: Auth token doesn't have permissions

**Symptom**: Upload fails with "403 Forbidden"

**Fix**: Ensure token has `project:write` scope for `red-hat-it` org

### Issue: Release version mismatch

**Symptom**: Source maps uploaded but stack traces still minified

**Fix**: Ensure `SENTRY_RELEASE` matches exactly what apps use when loading Chrome

### Issue: URL prefix mismatch

**Symptom**: Source maps uploaded but not applied to errors

**Fix**: Verify `urlPrefix: '/apps/chrome/js'` matches actual Chrome JS URLs in production

## Konflux CI Build Testing

To test in Konflux (where builds actually run):

1. **Create PR** with the webpack.plugins.js changes
2. **Check Konflux build logs** for source map uploads
3. **Watch for `[Sentry webpack plugin] Source map upload failed`** — the build can still succeed while maps are missing; treat warnings as a release signal and investigate (auth, rate limits, network).
4. **Deploy to staging** environment
5. **Trigger test errors** in staging apps
6. **Verify Sentry** shows readable stack traces

## Success Criteria

- ✅ Source maps upload to all projects in `CHROME_SENTRY_PROJECTS` during build
- ✅ Build completes successfully; upload failures are logged (see `errorHandler` in `config/webpack.plugins.js`) and should be rare — investigate if you see warnings in CI
- ✅ Stack traces readable in all app projects
- ✅ Build time increase is acceptable (<1 minute)
- ✅ Konflux CI webpack/build steps complete; treat any `[Sentry webpack plugin] Source map upload failed` log line as a follow-up (maps may be missing even when the job is green)

## Rollback Plan

If issues occur, revert to single-project upload. This matches `@sentry/webpack-plugin` v4 option shapes (nested `release` + legacy upload paths), not the old flat `include` / top-level `release` string API:

```javascript
// In config/webpack.plugins.js, replace the multi-project block with:
...(process.env.ENABLE_SENTRY
  ? [
      sentryWebpackPlugin({
        ...(process.env.SENTRY_AUTH_TOKEN && {
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        silent: false,
        errorHandler: (err) => {
          console.warn('[Sentry webpack plugin] Source map upload failed:', err);
        },
        release: {
          name: process.env.SENTRY_RELEASE,
          inject: false,
          uploadLegacySourcemaps: {
            paths: ['dist/js'],
            urlPrefix: '/apps/chrome/js',
            rewrite: true,
          },
        },
        moduleMetadata: ({ release }) => ({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          release,
        }),
      }),
    ]
  : []),
```

Ensure `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_RELEASE` are set in CI the same way as for the multi-project build (for Red Hat IT SaaS, org is typically `red-hat-it`).

## Questions?

If you encounter issues or have questions, check:
- Sentry documentation: https://docs.sentry.io/platforms/javascript/sourcemaps/
- Webpack plugin docs: https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/webpack/
- Team Slack: #forum-insights-chrome

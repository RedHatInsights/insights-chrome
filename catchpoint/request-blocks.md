# Catchpoint Request Block Inventory

This file tracks requests that should be blocked in Catchpoint to keep synthetic
traffic out of analytics. These rules are configured manually in Catchpoint and
are not applied by this repository. Keep each configured rule here so the
Catchpoint setup can be reviewed alongside the monitor scripts.

For **Requests → Override → Child Host → Request Block**, Catchpoint treats the
match as a regular expression. Escape dots in hostnames (for example,
`analytics\.example\.com`). Use `.*` where a variable portion is needed; `*` on
its own is not a wildcard. Confirm the rule in an Instant Test after adding it.

## Analytics request blocks

Add one row per manually configured block. Prefer specific analytics hosts or
endpoints over broad URL fragments.

| Match pattern (regex) | Analytics entity | Catchpoint scope | Configured | Notes |
| --- | --- | --- | --- | --- |
| `.*\.pendo\.io([/:?#].*|$)` | Pendo | Test | Not yet | Matches Pendo subdomains, including the SDK and event hosts, across regional variants. Does not match Pendo guide assets served from `storage.googleapis.com`. |

## One-off validation in Catchpoint

Use this procedure to check the rule without changing the scheduled monitor:

1. In Catchpoint, open the existing production Playwright monitor [8413627](https://portal.catchpoint.com/ui/Symphony/ControlCenter/Tests/Test/8413627/Properties) and choose **Instant Test** from its menu.
2. In the one-off configuration, add a Request Block under **Requests → Override**. Choose **Child Host**, enter the regex above, and select **Request Block**. Keep this change in the one-off configuration for the first validation.
3. Add the monitor's credential-library entry if Catchpoint asks for credentials; instant tests don't inherit authentication settings.
4. Run the instant test and inspect its request waterfall. A matching Pendo request shown as blocked is a pass. If there are no Pendo requests, the result is inconclusive because the page may not have attempted Pendo traffic. If matching requests complete normally, the rule did not apply.

The monitor's WebSocket assertion should still pass. A Pendo script error can occur because blocking the SDK prevents it from loading; that alone does not mean the WebSocket check failed. Catchpoint notes that instant-test configuration can be based on an existing test, but Request settings vary by test type. If the Playwright instant-test configuration does not offer **Request Block**, this mechanism is unavailable for this test type and the portal run cannot validate it.

References: [Instant Tests](https://docs.catchpoint.com/docs/instant-tests-overview), [Request Override Guide](https://docs.catchpoint.com/docs/request-override-guide), and [Playwright Test](https://docs.catchpoint.com/docs/playwright-test).


## Existing script-level request suppression

These filters already run in the Catchpoint Playwright scripts to suppress
TrustArc consent traffic. They are not confirmation that equivalent Request
Block rules exist in Catchpoint configuration.

| Playwright URL pattern | Purpose | Used by |
| --- | --- | --- |
| `**/consent.trustarc.com/**` | Suppress TrustArc consent endpoint requests | `websocket.ts` |
| `**/libs/redhat/marketing/latest/trustarc/**` | Suppress TrustArc loader requests | `websocket.ts`, `landingpage.spec.ts`, `helppanel.spec.ts` |


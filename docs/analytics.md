# Analytics

## Pendo Config

```js
visitor: {
    id,
    internal,
    lang,
    isOrgAdmin,
    currentBundle,
    currentApp,
    ...entitlements,
},
account: {
    id: data.identity.account_number,
}
```

### Entitlements spread

The entitlements are passed to pendo as `entitlements_entitlementName` and `entitlements_entitlementName_trial`. If the current user has the entitlement or the trial entitlement, it will appear in the list.

### Debugging

You can invoke `pendo.enableDebugging()` from the web console to see the information passed to pendo to verify and debug if information is not showing up as it should.

### Pendo API

Applications are free to use the [Pendo API](https://developers.pendo.io/docs) in order to have more complex interactions with Pendo.

## Amplitude Autocapture Identity

Amplitude autocapture uses `identity.internal.account_id` as its user ID, matching the ID passed to Segment's `identify()` calls. It does not wait for Segment's global `ready()` callback or copy Segment's `anonymousId()` into Amplitude's device ID. Without an explicit device ID, Amplitude uses its stored ID, a URL-provided ID, or generates one. This is intentional so unrelated Segment integrations cannot block autocapture initialization.

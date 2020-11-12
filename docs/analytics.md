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

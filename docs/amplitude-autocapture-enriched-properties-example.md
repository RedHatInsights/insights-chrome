# Amplitude Autocapture - Enriched User Properties

40+ enriched user properties are automatically attached to all Amplitude autocapture events (clicks, page views, forms, downloads).

## Example Payload

```json
{
  "event_type": "$identify",
  "user_id": "58942720",
  "device_id": "169c3ac3-0d90-4027-8313-22f45a78346d",
  "user_properties": {
    "$set": {
      "internal": false,
      "isBeta": false,
      "isOrgAdmin": true,
      "org_id": "20283813",
      "account_id": "acct-456789",
      "account_number": "12845372",
      "locale": "en",
      "email_domain": "redhat.com",
      "current_bundle": "insights",
      "current_app": "dashboard",
      "entitlement_insights": true,
      "entitlement_insights_trial": false,
      "entitlement_cost_management": true,
      "entitlement_cost_management_trial": false,
      "entitlement_ansible": false,
      "entitlement_ansible_trial": false
      // ... 30+ more entitlement properties
    }
  }
}
```

## Property Reference

### Core Properties

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `internal` | boolean | `false` | Red Hat internal user (filter out testing) |
| `isBeta` | boolean | `false` | Preview/Beta mode enabled |
| `isOrgAdmin` | boolean | `true` | Organization administrator |
| `org_id` | string | `"20283813"` | Organization identifier |

### Organization Context

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `account_id` | string | `"acct-456789"` | Internal account ID |
| `account_number` | string | `"12845372"` | EBS account number |
| `organization_name` | string | `"Acme Corp"` | Org display name |

### User Context

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `locale` | string | `"en"` | User locale |
| `email_domain` | string | `"redhat.com"` | Email domain (no PII) |

### Application Context

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `current_bundle` | string | `"insights"` | Current bundle |
| `current_app` | string | `"dashboard"` | Current application |

### Entitlements

Each service has two properties: `entitlement_{service}` (boolean) and `entitlement_{service}_trial` (boolean).

**Services:** acs, ansible, cost_management, insights, internal, migrations, openshift, rhel, rhoam, rhods, rhosak, settings, smart_management, subscriptions, user_preferences

## Example Queries

**Trial conversion:**
```
WHERE entitlement_*_trial = true
GROUP BY service
```

**Admin vs non-admin:**
```
WHERE isOrgAdmin = true vs false
```

**Beta validation:**
```
WHERE isBeta = true
```

**Cross-product journey:**
```
WHERE entitlement_insights = true AND entitlement_cost_management = true
GROUP BY current_app sequence
```

**Enterprise segmentation:**
```
GROUP BY org_id, organization_name
ORDER BY event_count DESC
```

## Technical Details

- **Naming**: camelCase for booleans, snake_case for IDs (Segment convention)
- **Attachment**: Set once via `$identify` during SDK initialization
- **Persistence**: Properties persist across all subsequent session events
- **Feature flag**: `platform.chrome.analytics.amplitude.autocapture`
- **Privacy**: No PII; emails transformed to domain-only
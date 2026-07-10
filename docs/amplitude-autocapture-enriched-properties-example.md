# Amplitude Autocapture - Enriched User Properties Example

## Overview

Amplitude autocapture events now include 40+ enriched user properties for better segmentation and analysis. These properties are automatically attached to all autocapture events (clicks, page views, form interactions, etc.).

## Example Payload

Here's a real example of the enriched properties sent with Amplitude autocapture events:

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
      "account_id": "20283813",
      "account_number": "12845372",
      "locale": "en",
      "email_domain": "redhat.com",
      "current_bundle": "insights",
      "current_app": "dashboard",
      "entitlement_acs": false,
      "entitlement_acs_trial": false,
      "entitlement_ansible": false,
      "entitlement_ansible_trial": false,
      "entitlement_cost_management": true,
      "entitlement_cost_management_trial": false,
      "entitlement_insights": true,
      "entitlement_insights_trial": false,
      "entitlement_internal": false,
      "entitlement_internal_trial": false,
      "entitlement_migrations": true,
      "entitlement_migrations_trial": false,
      "entitlement_openshift": false,
      "entitlement_openshift_trial": false,
      "entitlement_rhel": true,
      "entitlement_rhel_trial": false,
      "entitlement_rhoam": false,
      "entitlement_rhoam_trial": false,
      "entitlement_rhods": false,
      "entitlement_rhods_trial": false,
      "entitlement_rhosak": false,
      "entitlement_rhosak_trial": false,
      "entitlement_settings": true,
      "entitlement_settings_trial": false,
      "entitlement_smart_management": false,
      "entitlement_smart_management_trial": false,
      "entitlement_subscriptions": true,
      "entitlement_subscriptions_trial": false,
      "entitlement_user_preferences": true,
      "entitlement_user_preferences_trial": false
    }
  }
}
```

## Property Categories

### 🎯 Required Properties

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `internal` | boolean | `false` | Whether the user is a Red Hat internal user |

**Use case:** Filter out internal testing/usage from customer analytics

---

### 🌟 Stretch Goal Properties

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `isBeta` | boolean | `false` | Whether user is in Preview/Beta mode |
| `isOrgAdmin` | boolean | `true` | Whether user is an organization administrator |
| `org_id` | string | `"20283813"` | Organization identifier |

**Use cases:**
- Compare beta vs production feature adoption
- Analyze admin vs non-admin behavior patterns
- Segment by organization for enterprise analysis

---

### 🏢 Organization Context

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `account_id` | string | `"20283813"` | Account identifier (matches org_id) |
| `account_number` | string | `"12845372"` | EBS account number |
| `organization_name` | string | `"Acme Corp"` | Organization display name |

**Use cases:**
- Track multi-organization account behavior
- Enterprise customer journey mapping
- Account-level feature usage reporting

---

### 👤 User Context

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `locale` | string | `"en"` | User's locale preference |
| `email_domain` | string | `"redhat.com"` | Domain portion of user's email |

**Use cases:**
- Internationalization feature adoption
- Identify corporate vs personal email usage
- Geographic segmentation

---

### 📱 Application Context

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `current_bundle` | string | `"insights"` | Current bundle/product area |
| `current_app` | string | `"dashboard"` | Current application |

**Use cases:**
- Cross-bundle user journey analysis
- App-to-app navigation patterns
- Feature discovery flow tracking

---

### 🔑 Entitlements (20 services × 2 properties = 40 total)

Each service has two properties:
- `entitlement_{service}` - Whether user has access to the service
- `entitlement_{service}_trial` - Whether access is via trial

**Example services:**

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `entitlement_insights` | boolean | `true` | Has Insights entitlement |
| `entitlement_insights_trial` | boolean | `false` | Insights via trial |
| `entitlement_cost_management` | boolean | `true` | Has Cost Management entitlement |
| `entitlement_cost_management_trial` | boolean | `false` | Cost Management via trial |
| `entitlement_ansible` | boolean | `false` | Has Ansible entitlement |
| `entitlement_ansible_trial` | boolean | `false` | Ansible via trial |
| `entitlement_openshift` | boolean | `false` | Has OpenShift entitlement |
| `entitlement_openshift_trial` | boolean | `false` | OpenShift via trial |

**All entitlement services:**
- acs
- ansible
- cost_management
- insights
- internal
- migrations
- openshift
- rhel
- rhoam
- rhods
- rhosak
- settings
- smart_management
- subscriptions
- user_preferences

**Use cases:**
- Analyze feature usage by entitlement level
- Trial conversion analysis
- Cross-product usage patterns
- Identify upsell opportunities

---

## Total Properties

**40+ properties** are now automatically enriched on every Amplitude autocapture event:

- 1 required property (internal)
- 3 stretch goal properties (isBeta, isOrgAdmin, org_id)
- 3 organization properties
- 2 user properties  
- 2 application properties
- 30+ entitlement properties (15 services × 2 properties each)

---

## Example Analysis Queries

### 1. **Trial Conversion Analysis**
```
"Show me users who clicked 'Upgrade' button"
  WHERE entitlement_*_trial = true
  GROUP BY service
```

### 2. **Admin vs Non-Admin Feature Adoption**
```
"Compare feature X usage"
  WHERE isOrgAdmin = true vs false
```

### 3. **Beta Feature Validation**
```
"How many beta users clicked new feature Y?"
  WHERE isBeta = true
```

### 4. **Internal vs Customer Usage**
```
"Filter out internal testing from metrics"
  WHERE internal = false
```

### 5. **Cross-Product Journey**
```
"Track users navigating from Insights to Cost Management"
  WHERE entitlement_insights = true 
  AND entitlement_cost_management = true
  GROUP BY current_app sequence
```

### 6. **Enterprise Customer Segmentation**
```
"Top 10 organizations by dashboard engagement"
  GROUP BY org_id, organization_name
  ORDER BY event_count DESC
```

---

## Technical Notes

- **Property Naming**: Matches Segment analytics conventions (camelCase for booleans, snake_case for IDs)
- **Automatic Attachment**: Properties are set once during Amplitude SDK initialization via `$identify` event
- **Persistence**: Properties persist across all subsequent autocapture events in the session
- **Feature Flag Gating**: Controlled by `platform.chrome.analytics.amplitude.autocapture` flag
- **Privacy**: No PII included (emails are transformed to domain-only)

---

## Next Steps

These enriched properties enable powerful segmentation and analysis in Amplitude. Product managers can now:

1. ✅ Filter internal vs customer usage
2. ✅ Compare beta vs production adoption
3. ✅ Segment by organization and entitlements
4. ✅ Track cross-product journeys
5. ✅ Analyze trial conversion funnels
6. ✅ Measure admin vs user behavior

All without requiring custom event tracking code!

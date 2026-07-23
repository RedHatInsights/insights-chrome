# Amplitude Autocapture - Tenant Application Coverage

All tenant applications automatically get enriched user properties on autocapture events with zero code changes.

## How It Works

### Chrome-Level Initialization

Amplitude autocapture SDK initializes once in Chrome shell (`src/analytics/useAmplitude.ts`):

```typescript
amplitude.add(autocapturePlugin());
amplitude.init(autocaptureKeyToUse, userId, {
  deviceId: deviceId,
  defaultTracking: {
    sessions: true,
    pageViews: true,
    formInteractions: true,
    fileDownloads: true,
  },
});
amplitude.identify(identifyEvent); // 40+ enriched properties
```

### DOM-Level Event Capture

Autocapture plugin uses browser-level event listeners on `document`:

- Captures events from entire DOM (Chrome shell + tenant apps)
- Captures events from Module Federation apps (same document context)
- User properties persist across all captured events
- **Note**: Iframe events not captured (separate document context; Module Federation apps don't use iframes)

### What Gets Captured

- Clicks on buttons, links, navigation
- Form interactions (focus, changes, submissions)
- Page views (route changes)
- File downloads

All events include enriched user properties automatically.

## Example: Cross-App Journey

User navigates Dashboard → Cost Management:

**Event 1: Click "Cost Management" nav link**
```json
{
  "event_type": "[Amplitude] Element Clicked",
  "user_properties": {
    "$set": {
      "current_bundle": "insights",
      "current_app": "dashboard",
      "isOrgAdmin": true,
      "org_id": "20283813"
      // ... 40+ properties
    }
  }
}
```

**Event 2: Cost Management page view**
```json
{
  "event_type": "[Amplitude] Page Viewed",
  "user_properties": {
    "$set": {
      "current_bundle": "cost-management",  // Updated
      "current_app": "cost-management",     // Updated
      "isOrgAdmin": true,
      "org_id": "20283813"
      // ... 40+ properties
    }
  }
}
```

**Event 3: Click "Create Budget" button**
```json
{
  "event_type": "[Amplitude] Element Clicked",
  "event_properties": {
    "[Amplitude] Element Text": "Create Budget"
  },
  "user_properties": {
    "$set": {
      "current_bundle": "cost-management",
      "current_app": "cost-management",
      "entitlement_cost_management": true
      // ... 40+ properties
    }
  }
}
```

## Dynamic Properties

Properties that update on navigation:

| Property | Updates When |
|----------|--------------|
| `current_bundle` | Navigate to different bundle |
| `current_app` | Navigate to different app |
| `isBeta` | Toggle Preview mode |

Properties that remain static:

`internal`, `isOrgAdmin`, `org_id`, `entitlement_*`, `locale`, `email_domain`

## Coverage Matrix

**What IS captured:**
- Module Federation apps
- React and non-React apps
- Dynamically loaded content
- SPAs with client-side routing
- Forms, buttons, links, downloads

**What is NOT captured:**
- Same-origin/cross-origin iframes (separate document context)
- Events before SDK initialization
- Custom events (use Segment `analytics.track()`)
- Server-side actions

## Tenant App Developer Experience

**Required:** Nothing. Zero code changes.

**Optional custom events:**
```typescript
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const { analytics } = useChrome();
analytics.track('Budget Created', { budget_amount: 1000 });
// Enriched properties automatically included
```

## Example Queries

**Org admins creating budgets:**
```
Event: [Amplitude] Element Clicked
WHERE [Amplitude] Element Text = "Create Budget" AND isOrgAdmin = true
```

**Trial users interacting with features:**
```
Event: [Amplitude] Element Clicked
WHERE entitlement_cost_management_trial = true
```

**Beta feature adoption:**
```
Event: [Amplitude] Element Clicked
WHERE isBeta = true AND [Amplitude] Element Text = "Create Playbook"
```

**Top engaged organizations:**
```
Event: [Amplitude] Page Viewed
GROUP BY org_id, organization_name
ORDER BY event_count DESC
```

## Technical Details

**Amplitude Browser SDK:** Singleton pattern. Chrome initializes once; tenant apps share the same instance.

**Autocapture plugin:**
- Attaches event listeners to `document` (not scoped to specific elements)
- Uses event delegation (captures events from any child element)
- Listeners persist across route changes
- User properties from `identify()` attach to all subsequent events

**Module Federation:** Tenant apps render into the same DOM, events bubble to same document listeners, share same Amplitude SDK instance. Autocapture works seamlessly.

**Performance:**
- SDK loaded once by Chrome (~50KB gzipped)
- Single event listener per event type (delegation)
- Event batching reduces network requests
- Per batch: ~2-5KB (varies with payload size)

**Feature flag:** `platform.chrome.analytics.amplitude.autocapture`

## FAQ

**Q: Do I need to install Amplitude SDK in my tenant app?**  
No. Chrome shell handles it.

**Q: Do I need to call `amplitude.identify()` in my app?**  
No. Chrome shell already did it.

**Q: Can I add custom properties?**  
Yes. Use Segment `analytics.track()` as before. Enriched properties are automatically included.

**Q: What if my app uses a custom Amplitude instance?**  
Autocapture instance is separate. No conflict.

**Q: How do I test locally?**  
Enable the feature flag and check browser DevTools Network tab for Amplitude requests.

---

**Bottom line:** All 50+ tenant applications automatically benefit from enriched Amplitude autocapture with zero effort.
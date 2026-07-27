# Adding a New Platform to Left Navigation

This document outlines the effort and steps required to add a new platform to the Red Hat Hybrid Cloud Console left navigation (similar to how "Red Hat OpenShift" is currently configured).

## High-Level Scope

**Complexity: Medium** (3-5 days for a full implementation with testing)

## What Needs to Change

### 1. **Navigation Configuration** (Backend - Chrome Service)

- **Location**: JSON files served from `/api/chrome-service/v1/static/stable/stage/navigation/`
- **Files**: Likely `{platform}-navigation.json` (e.g., `openshift-navigation.json`)
- **Effort**: 1-2 hours
- **Details**: Define the navigation structure with links, permissions, favorites, grouping

### 2. **Bundle Registration** (Frontend - insights-chrome)

- **Location**: Bundle/routing configuration
- **Effort**: 2-4 hours
- **Details**: 
  - Register the new platform as a bundle
  - Define URL routes (`/openshift/*`, etc.)
  - Configure Module Federation manifest path
  - Set up base path and app routing

### 3. **RBAC/Permissions** (If Applicable)

- **Effort**: 1-2 hours
- **Details**: Define what permissions control visibility of the platform and its nav items

### 4. **Services Configuration**

- **Location**: `/api/chrome-service/v1/static/stable/stage/services/services.json`
- **Effort**: 30 mins - 1 hour
- **Details**: Add platform to the services list for "All Services" page

### 5. **Testing**

- **Unit tests**: 2-3 hours
  - Navigation rendering with new platform
  - Route matching
  - Permission-based visibility
- **Cypress component tests**: 2-3 hours
  - Navigation interactions
  - Platform switching
- **Playwright E2E tests**: 3-4 hours
  - Full navigation flow
  - Cross-platform navigation
  - Favorites functionality

### 6. **Documentation**

- **Effort**: 1-2 hours
- Update `docs/navigation.md` with the new platform structure

## Key Considerations

### 1. Is this a new application or just reorganizing existing apps?

- **New apps** = more work (Module Federation setup, separate repo)
- **Reorganizing existing** = just navigation config

### 2. Module Federation Implications

- Each platform's apps need their own federated modules
- Need manifest files at `/apps/{platform}/fed-mods.json`

### 3. Breaking Change Potential

- If it affects the Chrome API surface (`create-chrome.ts`), it's a **breaking change**
- Requires `breaking-change` label and migration docs for consuming apps

### 4. Backend Dependency

- The chrome-service backend needs to serve the navigation JSON
- Coordination with chrome-service team required

## Rough Timeline

| Scenario | Estimated Time |
|----------|---------------|
| Just navigation config (apps already exist) | 1-2 days |
| New platform with new apps | 3-5 days |
| With full E2E testing and docs | +1-2 days |

## Files You'd Touch

### Backend (chrome-service repository)

- Navigation JSON: `/api/chrome-service/v1/static/stable/stage/navigation/{platform}-navigation.json`
- Services JSON: `/api/chrome-service/v1/static/stable/stage/services/services.json`

### Frontend (insights-chrome repository)

- Bundle/routing configuration
- `docs/navigation.md` - Documentation update
- Test files:
  - `cypress/component/` - Component tests
  - `cypress/e2e/` - E2E tests
  - `playwright/e2e/` - Release gate tests
  - Unit tests next to modified source files

## Next Steps

To get a more precise breakdown:

1. **Clarify the scope**:
   - Are these new applications or reorganizing existing ones?
   - What permissions/RBAC requirements exist?
   - Are there Module Federation dependencies?

2. **Review existing platform configs**:
   - Look at OpenShift navigation JSON structure
   - Understand bundle registration patterns
   - Review routing configuration

3. **Coordinate with chrome-service team**:
   - Navigation JSON hosting
   - Services configuration
   - Deployment timeline

## Related Documentation

- [Navigation Configuration](./navigation.md) - Existing navigation documentation
- [Chrome API](./api.md) - Chrome JavaScript API
- [Testing Guidelines](./testing-guidelines.md) - Testing requirements

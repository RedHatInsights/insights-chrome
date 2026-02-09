# Wildcard Permission Matching

## Overview

The Chrome visibility functions now support wildcard pattern matching for permission validation. This allows broader permissions to properly cover more specific permission requirements.

## How It Works

Permissions are split by the `:` delimiter into segments. The wildcard character `*` can be used in any segment to match any value in that position.

### Pattern Matching Rules

1. Both the user permission and required permission must have the same number of segments
2. Each segment is compared individually
3. A `*` wildcard matches any value in that position
4. If all segments match (considering wildcards), the permission is granted

## Examples

### Full Wildcard

User has permission: `rbac:*:*`

**Matches:**
- `rbac:inventory:read` ✅
- `rbac:inventory:write` ✅
- `rbac:cost-management:read` ✅
- `rbac:cost-management:write` ✅

**Does not match:**
- `rbac:inventory` ❌ (different segment count)
- `other:inventory:read` ❌ (first segment doesn't match)

### Middle Wildcard

User has permission: `rbac:*:read`

**Matches:**
- `rbac:inventory:read` ✅
- `rbac:cost-management:read` ✅
- `rbac:any-service:read` ✅

### Last Wildcard

User has permission: `rbac:inventory:*`

**Matches:**
- `rbac:inventory:read` ✅
- `rbac:inventory:write` ✅
- `rbac:inventory:delete` ✅

# Token Flow Diagram - Before & After

## ❌ BEFORE (Problem)

```
Page Refresh
    ↓
localStorage
    ↓
Zustand Store LOADED ✅
    |
    ├─ token: "abc123"
    ├─ refreshToken: "xyz789"
    └─ isAuthenticated: true
    ↓
App Component Mounts
    ↓
API Client interceptor checks:
    if (authToken) → null ❌
    ↓
Request sent WITHOUT Authorization header ❌
    ↓
Server returns 401 Unauthorized
    ↓
Interceptor tries to refresh:
    refreshToken = getRefreshToken() → from localStorage
    ↓
Refresh succeeds, gets new token
    ↓
BUT: authToken variable still not updated for next request ❌
    ↓
Some requests still fail with 401
    ↓
Eventually: All tokens cleared, user redirected to login ❌
    ↓
"Session Expired 3" toast appears
```

**The Problem:** Zustand ≠ API Client Token

- Zustand had token from localStorage
- API client's `authToken` variable was empty
- Out of sync = failed requests = forced logout

---

## ✅ AFTER (Solution)

```
Page Refresh
    ↓
localStorage
    ↓
Zustand Store LOADED ✅
    |
    ├─ token: "abc123"
    ├─ refreshToken: "xyz789"
    └─ isAuthenticated: true
    ↓
App Component Mounts
    ↓
AppContent Component Renders
    ↓
useAuthInitialize() Hook Fires 🎯
    ↓
    1. Get token from localStorage
    2. Sync to Zustand store (already loaded, confirm)
    3. Update API client: setAuthToken(token)
    ↓
API Client authToken NOW has correct token ✅
    ↓
REQUEST INTERCEPTOR:
    const currentToken = useAuthStore.getState().token || authToken
    → returns "abc123" ✅
    ↓
Request sent WITH Authorization header ✅
    ↓
Server returns 200 OK ✅
    ↓
Session persists, user stays logged in ✅
```

**The Solution:** Full Synchronization on Mount

- App mounts → Hook fires
- Hook syncs: localStorage → Zustand → API Client
- All three in sync ✅
- Requests include auth header ✅
- User stays logged in ✅

---

## Token Refresh Flow

### ❌ BEFORE (Partial Sync)

```
Access Token Expires (401)
    ↓
Interceptor catches 401
    ↓
Get refreshToken from localStorage
    ↓
Call /auth/refresh-token
    ↓
Get new accessToken
    ↓
Update API client: setAuthToken(newToken) ✅
Update localStorage: setAuthTokens(newToken) ✅
    ↓
But: Zustand store NOT updated ❌
    ↓
Next component reads from Zustand:
    const token = useAuthStore((state) => state.token)
    → still has OLD token ❌
```

### ✅ AFTER (Full Sync)

```
Access Token Expires (401)
    ↓
Interceptor catches 401
    ↓
Get refreshToken from Zustand OR localStorage
    ↓
Call /auth/refresh-token
    ↓
Get new accessToken
    ↓
Update BOTH:
  1. Zustand store: useAuthStore.getState().setToken() ✅
  2. API client: setAuthToken() ✅
  3. localStorage: setAuthTokens() ✅
    ↓
All three synchronized ✅
    ↓
Next component reads from Zustand:
    const token = useAuthStore((state) => state.token)
    → has NEW token ✅
    ↓
Retry original request with new token ✅
```

---

## Logout Flow

### ❌ BEFORE (Partial Clear)

```
User Clicks Logout
    ↓
Clear localStorage ✅
    ↓
But: Zustand store NOT cleared ❌
    ↓
API client authToken NOT cleared ❌
    ↓
Component reads from Zustand:
    Still has token ❌
```

### ✅ AFTER (Full Clear)

```
User Clicks Logout
    ↓
Clear BOTH:
  1. Zustand store: useAuthStore.getState().logout() ✅
  2. localStorage: clearAuth() ✅
  3. API client: setAuthToken(null) ✅
    ↓
All three cleared ✅
    ↓
Component reads from Zustand:
    token = null ✅
    isAuthenticated = false ✅
    ↓
RequireAuth component redirects to login ✅
```

---

## Component Interaction Diagram

### ❌ BEFORE (Disconnected)

```
┌─────────────────────────────────────┐
│         localStorage                 │
│  token: "abc123"                    │
│  refreshToken: "xyz789"             │
└──────────────┬──────────────────────┘
               │
        (on app refresh)
               │
          ┌────▼────┐
          │ Zustand │  (has token)
          │  Store  │
          └─────────┘
               │
               X (NOT connected)
               │
        ┌──────▼─────────────┐
        │   API Client       │
        │  authToken: null   │  ❌ EMPTY!
        │  (request failure) │
        └────────────────────┘
```

### ✅ AFTER (Synchronized)

```
┌─────────────────────────────────────┐
│         localStorage                 │
│  token: "abc123"                    │
│  refreshToken: "xyz789"             │
└──────────────┬──────────────────────┘
               │
        useAuthInitialize()
               │
          ┌────▼────────────────┐
          │ Zustand Store       │
          │ token: "abc123"     │  ✅ SYNCED
          │ refreshToken: ...   │
          └────────┬────────────┘
                   │
            (reads from)
                   │
        ┌──────────▼──────────────┐
        │   API Client            │
        │  authToken: "abc123"    │  ✅ SYNCED
        │  (requests work!)       │
        └─────────────────────────┘
```

---

## Request Lifecycle

### Request Interceptor

```
API Request Initiated
    ↓
req.use() interceptor fires
    ↓
// ✅ NEW: Read from Zustand first
const currentToken = useAuthStore.getState().token || authToken
    ↓
if (currentToken) {
    headers.set("Authorization", `Bearer ${currentToken}`)
} ✅
    ↓
Add cache headers for GET requests
    ↓
Log request
    ↓
Send request WITH Authorization header ✅
```

### Response Interceptor (Error Path)

```
Response Error (401 Unauthorized)
    ↓
Get current token from Zustand
    ↓
Check if dummy token (skip refresh for super admin)
    ↓
Try to refresh:
    1. Get refreshToken from Zustand OR localStorage
    2. POST to /auth/refresh-token
    3. Get new accessToken
    ↓
Success:
    ✅ Update Zustand store
    ✅ Update API client
    ✅ Update localStorage
    ✅ Retry original request
    ↓
Failure:
    ✅ Clear Zustand store
    ✅ Clear localStorage
    ✅ Clear API client
    ✅ Show "Session Expired" toast
    ✅ Redirect to login
```

---

## State Timeline: Page Refresh Scenario

```
T1: Browser Refresh (F5)
    ├─ localStorage has: { token, refreshToken }
    └─ Zustand state: empty

T2: React App Mounts
    ├─ Zustand persist middleware loads from localStorage
    ├─ Zustand state: { token, refreshToken } ✅
    └─ API Client authToken: null ❌

T3: useAuthInitialize() Hook Fires 🎯
    ├─ Read token from localStorage
    ├─ Sync to Zustand (confirm state)
    ├─ Update API Client: setAuthToken(token)
    ├─ Zustand state: { token, refreshToken } ✅
    └─ API Client authToken: "abc123" ✅

T4: Routes Render
    ├─ RequireAuth component checks token
    ├─ Token exists ✅
    └─ Allow access ✅

T5: API Request Made
    ├─ Interceptor reads from Zustand ✅
    ├─ Authorization header added ✅
    └─ Request succeeds ✅
```

---

## Benefits of This Approach

```
✅ Single Source of Truth: Zustand store
✅ Consistent Fallback: localStorage for persistence
✅ Client Sync: API client always has latest token
✅ Automatic Refresh: Handles token expiration
✅ Clean Logout: All stores cleared together
✅ No Race Conditions: Synchronous initialization
✅ Backward Compatible: Old localStorage still works
✅ Dev Tools: Zustand DevTools shows auth state
✅ Performance: Tokens loaded once on app mount
✅ Debuggable: Clear console logs on sync
```

---

## Testing Checklist with Flow Verification

### ✅ Test: Page Refresh During Session

```
1. Login (token in localStorage + Zustand)
2. Open DevTools → Application → Local Storage
3. Verify: "auth-storage" exists with token
4. Refresh page (F5)

Flow Check:
  T1: Page loads
  T2: Zustand loads from localStorage ✅
  T3: useAuthInitialize fires
  T4: API client gets token ✅
  T5: Protected page loads ✅

Expected: No redirect, page loads normally
```

### ✅ Test: Token Expiration

```
1. Login
2. Wait for access token to expire
3. Make any API request

Flow Check:
  T1: Request sent with token
  T2: Server returns 401 ✅
  T3: Interceptor gets refreshToken from Zustand ✅
  T4: Refresh endpoint called ✅
  T5: New token received ✅
  T6: Zustand updated ✅
  T7: Original request retried with new token ✅

Expected: Request succeeds, user doesn't notice
```

### ✅ Test: Logout

```
1. Login (token in all stores)
2. Click Logout

Flow Check:
  T1: Logout handler fires
  T2: useAuthStore.logout() called ✅
  T3: Zustand state cleared ✅
  T4: localStorage cleared ✅
  T5: API client cleared ✅

Expected: Redirected to login, all data cleared
```

---

## Troubleshooting Guide

### Problem: Still seeing "Session Expired"

**Check 1: Token in localStorage?**

```
DevTools → Application → Local Storage
Look for: "auth-storage" key
Should contain: { token, refreshToken }
```

**Check 2: Console logs?**

```
Open DevTools → Console
Should see: "✅ Auth initialized from localStorage"
on app refresh
```

**Check 3: API Authorization header?**

```
DevTools → Network
Check request headers
Should have: "Authorization: Bearer <token>"
```

**Check 4: Token format?**

```
Token should NOT start with "dummy-"
(unless you're testing super admin)
```

### Problem: Token not syncing

**Check 1: Hook running?**

```
Add console.log in useAuthInitialize
Verify hook fires on app mount
```

**Check 2: Zustand state?**

```
Install Zustand DevTools extension
Verify state changes on hook fire
```

**Check 3: API client?**

```
Check: api.defaults.baseURL
Should match your backend URL
```

---

## Migration Reference

**What Changed:**

- Where: `src/lib/api/client.ts` - request/response interceptors
- Where: `src/App.tsx` - initialization structure
- New: `src/hooks/useAuthInitialize.ts` - token sync hook

**Why Changed:**

- Problem: Zustand and API client out of sync on refresh
- Solution: Sync on app mount via initialization hook

**How to Verify:**

1. Search for `✅ NEW WAY` in files
2. Compare with `❌ OLD WAY` comments
3. Test using scenarios in this document

---

## Summary

Old flow was fragmented (localStorage → Zustand → API Client weren't syncing).
New flow is unified (all three sync on app mount via initialization hook).
Result: Session persists, requests include auth headers, no forced logouts.

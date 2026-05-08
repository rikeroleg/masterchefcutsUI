# Auth Security: httpOnly Cookie Migration

**Date:** 2026-05-07  
**Repos touched:** `rikeroleg/masterchefcutsUI` (`fix/frontend-linting`) · `rikeroleg/MasterCheifCuts` (`fix/email-verification-bypass`)

---

## Problem

JWTs were stored in `localStorage` under the key `mc_token`. Any JavaScript running in the page — including injected scripts via XSS — can read `localStorage`. This is a well-known OWASP Top 10 vulnerability (A03: Injection / A01: Broken Access Control).

---

## What Changed

### Backend (`MasterCheifCuts`)

#### `AuthController.java`
- Added a `setAuthCookies(response, auth)` helper that sets two cookies on login / register / refresh responses:
  - `mc_auth` — the JWT access token. Attributes: `httpOnly=true`, `Secure=${security.cookie.secure}`, `SameSite=Strict`, `Path=/`, `Max-Age=<jwt-expiry-seconds>`
  - `mc_refresh` — the opaque refresh token. Same security attributes, but `Path=/api/auth/refresh` so it is only sent to that one endpoint
- **Tokens are removed from the JSON body** after being placed in cookies (`auth.setToken(null)`, `auth.setRefreshToken(null)`) — the response body never carries them
- Added `POST /api/auth/logout` endpoint: sets both cookies to empty with `Max-Age=0` (immediate expiry), regardless of whether the request has a valid session
- `/api/auth/refresh` now reads the refresh token from the `mc_refresh` cookie via `@CookieValue` instead of accepting a request body field

#### `JwtAuthFilter.java`
Token extraction priority order (first match wins):
1. `Authorization: Bearer <token>` header — kept for service-to-service / legacy clients
2. `mc_auth` httpOnly cookie — primary browser flow
3. `?token=` query parameter — kept for EventSource (SSE) which cannot set request headers

#### `AuthResponse.java`
Added `tokenExpiresAt` (`Long`, epoch ms). The frontend uses this to know when to schedule a proactive refresh, without ever needing to decode the JWT directly.

#### `JwtUtil.java`
Added `getExpirationMs()` getter so `AuthController` can set the correct `Max-Age` on the access cookie.

#### `AuthService.java`
`buildResponse()` now sets `tokenExpiresAt = System.currentTimeMillis() + expirationMs` when a token is issued; `null` otherwise (profile-update / `/me` responses).

#### `SecurityConfig.java`
Added `POST /api/auth/logout` to the CSRF ignore list and `permitAll()` so unauthenticated browsers can still send the cookie-clearing request after a hard reload.

#### `application.properties`
```properties
security.cookie.secure=${COOKIE_SECURE:true}
```
Defaults to `true` (HTTPS required). Override via env var.

#### `application-local.properties` (gitignored)
```properties
security.cookie.secure=false
```
Allows cookies over plain HTTP on `localhost`. Not committed — documented in `application-local-secrets.properties.example`.

---

### Frontend (`masterchefcutsUI`)

#### `src/api/client.js`
- Removed `getToken()` function and `Authorization: Bearer` header from all requests
- Added `credentials: 'include'` to every `fetch()` call (both JSON requests and file uploads) — this is what causes the browser to attach the httpOnly cookie automatically
- On 401: no longer removes `mc_token` from localStorage (it doesn't exist anymore); removes `mc_user` and `mc_cart` profile cache, then fires the `session-expired` event as before

#### `src/context/AuthContext.jsx`
- **Init**: reads `mc_user` (profile cache) from localStorage; no longer reads or validates `mc_token`
- **login / register**: no longer calls `localStorage.setItem('mc_token', ...)` — cookie is set server-side
- **logout**: now `async`; calls `POST /api/auth/logout` first to clear server cookies, then clears local state. If the server call fails, local state is still cleared
- **Proactive refresh**: previously decoded the JWT from localStorage to find `exp`; now uses `user.tokenExpiresAt` from the profile cache (set by the server in `AuthResponse.tokenExpiresAt`)
- `mc_user` (non-sensitive profile data: name, role, email, etc.) is still cached in localStorage for fast page load. This is not a secret.

---

## What Is Still in localStorage

| Key | Contains | Secret? |
|-----|----------|---------|
| `mc_user` | First/last name, email, role, shop name, address fields | No |
| `mc_cart` | Cart items (cut labels, prices) | No |
| ~~`mc_token`~~ | ~~JWT~~ | Removed |

---

## Cookie Attributes Reference

| Cookie | Path | httpOnly | Secure | SameSite | Max-Age |
|--------|------|----------|--------|----------|---------|
| `mc_auth` | `/` | ✅ | configurable | Strict | JWT expiry (default 24h) |
| `mc_refresh` | `/api/auth/refresh` | ✅ | configurable | Strict | 7 days |

`SameSite=Strict` means cookies are never sent on cross-site requests, which also mitigates CSRF. The existing `CookieCsrfTokenRepository` in `SecurityConfig` remains active for non-auth endpoints.

---

## Local Dev Setup

In your `application-local-secrets.properties` (gitignored), set:

```properties
COOKIE_SECURE=false
```

Without this, Spring will set `Secure=true` on cookies, which browsers reject over plain HTTP (`localhost:8080`). The example file (`application-local-secrets.properties.example`) documents this.

The frontend has no env change needed — `credentials: 'include'` works on `localhost` regardless.

---

## CORS

`CorsConfig.java` already had `config.setAllowCredentials(true)` before this change. Cookies only work cross-origin when `allowCredentials` is true and the origin is explicitly allowed (not `*`). Both conditions were already met.

---

## Backward Compatibility

- Bearer header support is kept in `JwtAuthFilter` — any non-browser client or automated test that sends `Authorization: Bearer <token>` continues to work
- `?token=` SSE fallback is kept — the notification stream endpoint still works
- The `token` and `refreshToken` fields in `AuthResponse` are set to `null` in the JSON body on token-issuing endpoints. Clients that previously read `data.token` from the login response will get `null` and must migrate to cookie-based auth

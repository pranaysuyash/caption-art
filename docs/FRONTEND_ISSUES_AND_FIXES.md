# Frontend Issues & Fixes

This doc summarizes findings from the current dev run (4 Dec 2025). It covers the storage/persistence state, frontend console errors, root causes, and remediation suggestions.

## 1) Persistence / DB

- Current backend store: In-memory Maps (v1), found in `backend/src/models/auth.ts`, `backend/src/models/Workspace.ts`, `backend/src/models/Asset.ts`, `backend/src/models/Caption.ts`, etc.
- README currently states: "All data is stored in memory for v1 (will be migrated to database)".
- Implication: Server restarts delete all state, not suitable for production. A proper DB migration plan (Postgres + Prisma recommended) should be implemented.

### Short-term action

- Leave as-is for local development, add DB migration plan and optional incremental POC (e.g. migrate `WorkspaceModel` to Prisma).

## 2) Console Errors & Observed Failures

Logs observed in browser console (dev run):

- "Download the React DevTools..." (suggestion) — not an error
- "Uncaught (in promise) Error: Access to storage is not allowed from this context." (multiple times) — indicates localStorage/sessionStorage access raised an exception (e.g., worker/service worker, cross-origin iframe, sandboxed context, or blocked by browser extension/setting). The code directly calls `localStorage.*` in multiple places.
- Many preload warnings: "The resource <URL> was preloaded using link preload but not used within a few seconds..." — these are performance warnings and not harmful; fix by only preloading resources you use immediately or adjust `as`.
- POST /api/auth/signup 409 (Conflict) — sign-up failed due to duplicate user (expected if `test@example.com` exists); not a bug.
- GET /api/workspaces 401 (Unauthorized) — API responded with 401; front-end didn't receive valid session/cookie and no Authorization token was provided.
- POST /api/campaigns 401 (Unauthorized) — same root cause as Workspaces.

## 3) Root causes

- Mismatch in frontend/backend authentication mechanism

  - Backend uses HTTP-only cookie session (backend `auth.ts` sets `res.cookie('sessionId', ...)`) and session stored in in-memory `sessions` map.
  - Frontend uses a mix of approaches: some clients expect JWT stored in localStorage (`Authorization: Bearer <token>`), while Login.tsx uses cookie-based login (sets cookie via `credentials: 'include'` when POST `/api/auth/login`).
  - Many API client fetches do not include `credentials: 'include'`, therefore HTTP-only cookie isn't sent with requests; when no token present in localStorage either, server returns 401.

- localStorage usage causes exceptions in some contexts
  - The error "Access to storage is not allowed from this context." suggests code accesses localStorage in a non-window context or while blocked. There are many `localStorage.getItem(...)` calls in the frontend across API clients and components.
  - This likely occurs when code runs from an environment where `localStorage` is not defined or not allowed (e.g., Service Worker, extension, cross-origin iframe). It should be handled gracefully.

## 4) Recommendations & Fixes

### A) Immediate fixes (small, low-risk)

1. Centralize client fetch options and default to cookie-based session usage:

   - Create a single HTTP wrapper `frontend/src/lib/api/httpClient.ts` that calls `fetch` with `credentials: 'include'` by default.
   - Update `backendClient.ts`, `workspaceClient.ts`, `campaignClient.ts`, etc. to use that wrapper or add `credentials: 'include'` to each fetch request.

   Example snippet (httpClient.ts):

   ```ts
   export async function apiFetch(url: string, options: RequestInit = {}) {
     const defaultOptions: RequestInit = {
       credentials: 'include',
       headers: {
         'Content-Type': 'application/json',
       },
       ...options,
     };
     return fetch(url, defaultOptions);
   }
   ```

2. Standardize frontend auth pattern:

   - Decide between cookie-based or token-based auth. Backend currently uses cookie sessions; so prefer that for v1.
   - Remove `Authorization: Bearer ...` usage or adapt code to treat it as secondary (optional).
   - Update `workspaceClient`/`campaignClient` to include `credentials: 'include'` or use `apiFetch` wrapper.

3. Wrap localStorage access in a safe utility to avoid runtime exceptions:

   - Add a small `safeLocalStorage` with try/catch for `getItem`, `setItem`, `removeItem`.
   - Replace `localStorage.*` across the application with that wrapper.

   Example:

   ```ts
   export const safeLocalStorage = {
     getItem: (k: string) => {
       try {
         return window.localStorage.getItem(k);
       } catch (e) {
         console.warn('localStorage not accessible', e);
         return null;
       }
     },
     setItem: (k: string, v: string) => {
       try {
         window.localStorage.setItem(k, v);
       } catch (e) {
         console.warn('localStorage not accessible', e);
       }
     },
     removeItem: (k: string) => {
       try {
         window.localStorage.removeItem(k);
       } catch (e) {
         console.warn('localStorage not accessible', e);
       }
     },
   };
   ```

4. Address preload warnings: Remove unused preloads or ensure `as` property matches (script, style, image, etc.). Not urgent; optimization only.

### B) Medium-term fixes

1. Consolidate authentication client models:

   - If sticking to session cookies, remove token-based workflows or map backend to return access tokens (JWT) as desired.
   - If switching to JWT token-based: backend must return refresh/access tokens and token renewal endpoints; then the frontend should store token securely (HTTP-only vs localStorage tradeoffs). For now, cookie-based is fine.

2. Add a small `AuthContext` to store and validate session. On app load, call `/api/auth/me` (with credentials: 'include') to set user state and handle redirects if not authenticated.

3. For local dev, allow `VITE_API_BASE` and CORS settings to permit cookies/credentials in dev: backend CORS config should include `credentials: true`, `origin: 'http://localhost:5174'` (or `*` with caution).

### C) Long-term: DB & Sessions

1. Migrate the server session store to a persistent store (Redis) and user data to a database (Postgres + Prisma). This will allow scaling and session persistence across multiple backend instances.
2. Implement proper password hashing and storage in DB rather than plain text or sim simulation.
3. Rework identity: either remain cookie session-based or adopt token-based (OAuth/JWT). Use secure cookies or rotating refresh tokens.

## 5) Proposed Next Steps (Actionable)

- Immediate (this afternoon):

  1. Add `credentials: 'include'` to all fetch calls (or implement a wrapper). This will stop 401s when using cookie-based auth.
  2. Add `safeLocalStorage` wrapper and replace localStorage usage in key locations (WorkspaceContext, workspace list, etc.) to prevent "Access to storage is not allowed" exceptions.
  3. Verify login flow using the sample account `test@example.com` — signup returns 409 when email exists; avoid duplicating signups.

- Next (tomorrow):

  1. Revisit the mix of `auth_token` / `authToken` `localStorage` keys and standardize or remove them.
  2. Implement small `AuthContext` that calls `/api/auth/me` with `credentials: 'include'` on app start and stores user profile in React Context.

- Longer term (sprint):
  1. Decide the authentication model (cookie session vs JWT) and standardize all clients.
  2. Begin DB migration for core models (Workspaces, Users, Assets) using a POC with Prisma + Postgres. Implement repo-level interface with both memory and DB backends.

## 6) Suggested Code Changes (examples)

- httpClient wrapper (see above)
- Replace fetch in `workspaceClient.ts` with `apiFetch` or add `credentials: 'include'`

Example (workspaceClient.ts):

```ts
import { apiFetch } from './httpClient';

export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await apiFetch(`${API_URL}/workspaces`, { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to fetch workspaces');
  }
  return response.json();
}
```

- `safeLocalStorage` usage example (in contexts where localStorage is optional):

```ts
const savedId = safeLocalStorage.getItem('activeWorkspaceId')
if (savedId) { ... }
```

## 7) Closing Notes

- The backend is intentionally in-memory for v1; a DB migration is required for prod.
- The immediate issue preventing login usage is that frontend requests are not consistently sending cookies. Updating API clients to include `credentials: 'include'` will fix the 401.
- The storage error is likely environmental; wrap localStorage and avoid using it in workers or contexts that disallow it.

If you'd like, I can:

- Implement a PR that adds `apiFetch` wrapper + `safeLocalStorage` and updates all API clients to use them.
- Implement an incremental POC for WorkspaceModel migration to Prisma + Postgres.
- Or both — tell me which you'd like me to do first and I'll implement it.

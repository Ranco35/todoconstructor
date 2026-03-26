# Authentication Security Audit
**Project:** todoconstructor (Next.js + Supabase Auth + @supabase/ssr)
**Date:** 2026-03-25
**Auditor:** auth-security-auditor agent

---

## Discovered Implementation

The project uses `@supabase/ssr` for server-side session management with the following patterns:

- **Browser client** (`src/lib/supabase.ts`): `createBrowserClient` with PKCE flow and `persistSession: true`
- **Server clients** (`src/lib/supabase-server.ts`): multiple `createServerClient` wrappers (`createServerComponentClient`, `createRouteHandlerClient`, `createServerActionClient`, `getSupabaseServiceClient`)
- **Middleware** (`src/middleware.ts`): session check via `supabase.auth.getSession()` protecting `/dashboard` routes
- **Login flow** (`src/app/api/auth/login/route.ts` + `src/app/login/page.tsx`): API-route-based login that returns raw JWT tokens to the client, which then calls `supabase.auth.setSession()` client-side
- **Auth actions** (`src/actions/configuration/auth-actions.ts`): `getCurrentUser()` using `supabase.auth.getUser()` — correct server-side user verification
- **Service role client**: used in multiple action files for RLS-bypass operations

---

## Documentation vs Reality

### 1. Middleware uses `getSession()` instead of `getUser()`

**Supabase documentation states** (https://supabase.com/docs/guides/auth/server-side/nextjs):

> "IMPORTANT: It's unsafe to trust the data returned by `getSession()` in Server Components, Server Actions, and Route Handlers. Instead, use `getUser()` which sends a request to the Supabase Auth server every time to revalidate the Auth token."
>
> The middleware example in official docs uses `supabase.auth.getUser()`:
> ```ts
> const { data: { user }, error } = await supabase.auth.getUser()
> ```

**What's implemented** (`src/middleware.ts`, line 44):
```ts
const { data: { session }, error } = await supabase.auth.getSession()
hasSupabaseSession = !!session && !error
```

`getSession()` reads the session from the cookie without revalidating it against the Supabase Auth server. A tampered or expired JWT stored in a cookie would pass this check. The middleware is the primary gatekeeper for `/dashboard` routes, making this a critical trust boundary.

---

### 2. Login flow transmits raw JWT tokens over the API response body

**Supabase documentation states** that when using `@supabase/ssr`, session tokens are managed automatically via cookies set by the server client. The documented pattern for a Route Handler login does not involve returning tokens in the JSON response body.

**What's implemented** (`src/app/api/auth/login/route.ts`, lines 113–116):
```ts
session: {
  access_token: data?.session?.access_token ?? '',
  refresh_token: data?.session?.refresh_token ?? '',
}
```

And (`src/app/login/page.tsx`, lines 66–71):
```ts
if (result.session?.access_token && result.session?.refresh_token) {
  const supabase = createClient();
  await supabase.auth.setSession({
    access_token: result.session.access_token,
    refresh_token: result.session.refresh_token,
  });
}
```

This anti-pattern: (a) exposes raw tokens in the fetch response body visible in browser DevTools; (b) creates a split-session state where the server already wrote cookies via `cookieCarrier` AND the client calls `setSession()` again from the JSON payload — the Supabase docs warn against this dual-path approach; (c) passes the refresh token through JavaScript, making it accessible to XSS.

---

### 3. Dashboard layout uses `getSession()` client-side without `getUser()` verification

**Supabase documentation** recommends using `getUser()` whenever you need to trust that a user is authenticated, even on the client side, because `getSession()` reads from local storage / cookies without server verification.

**What's implemented** (`src/app/dashboard/layout.tsx`, lines 25–47):
```ts
const sessionPromise = supabase.auth.getSession();
// ...
const { data: { session }, error: sessionError } = await Promise.race([...])
if (!session) { setShouldRedirect(true); return; }
const user = session.user;
```

The layout trusts `session.user` from `getSession()` without calling `getUser()`. This is a client component, so the risk is lower than in server code, but it still establishes user identity (role, permissions) from unverified session data.

---

### 4. `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` — service role key with `NEXT_PUBLIC_` prefix

**Supabase documentation explicitly states:**

> "The service role key has admin privileges and should only be used in server-side code. Never expose the service role key to the client."
>
> Environment variables prefixed with `NEXT_PUBLIC_` are bundled into client-side JavaScript by Next.js.

**What's implemented** (`src/actions/products/update-sku-admin.ts`, line 19):
```ts
process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
```

Any variable named `NEXT_PUBLIC_*` is inlined into the browser bundle by Next.js at build time. If `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is set in the environment, the service role key will be exposed in the client-side JavaScript bundle, completely bypassing all RLS policies for anyone who opens DevTools.

---

### 5. Unauthenticated debug API routes expose internal data

**Supabase documentation on Route Handlers** states that route handlers should verify authentication before returning data:

> "You can protect your Route Handlers by checking if the user is authenticated."

The following `/api/debug/*` routes have **no authentication check at all** and return full database records:

- `src/app/api/debug/suppliers/route.ts` — returns all active suppliers including email, phone, city
- `src/app/api/debug/check-kunstmann/route.ts` — returns full `*` supplier records including contact emails
- `src/app/api/debug/reservation/[id]/route.ts` — returns full reservation data including client PII
- `src/app/api/debug/search-clients/route.ts` — returns client search results
- `src/app/api/debug/check-reservation-117/route.ts` — returns reservation and modular reservation rows
- `src/app/api/debug/force-calendar-reload/route.ts` — triggers cache revalidation for anyone

Similarly, several production `/api/` routes have no auth check:
- All of `src/app/api/sales/invoices/`, `src/app/api/sales/budgets/`, `src/app/api/sales/payments/`
- All of `src/app/api/pos/*` (resync-products, update-prices, clean-prices — destructive mutations)
- `src/app/api/clients/*` routes
- `src/app/api/suppliers/*` routes
- `src/app/api/check-env/route.ts` — reveals which API keys (OPENAI, ANTHROPIC, SUPABASE service role) are configured

The middleware `config.matcher` on line 75 explicitly **excludes** `/api/` routes:
```ts
'/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
```

This means the middleware never runs for any `/api/` route, so all API authentication depends entirely on individual route handlers — most of which have none.

---

### 6. `supabase-robust.ts` cookie adapter is read-only (missing `set`/`remove`)

**Supabase `@supabase/ssr` documentation** requires that the cookie adapter implement `getAll` and `setAll` (or `get`/`set`/`remove`) to allow the library to refresh tokens and update session cookies.

**What's implemented** (`src/lib/supabase-robust.ts`, lines 14–15):
```ts
cookies: { get: (name) => cookieStore.get(name)?.value },
```

Only `get` is implemented. The library cannot write refreshed tokens back to the cookie store, meaning sessions managed through this client will silently fail to refresh and will expire without recovery.

---

### 7. `reset-cash-actions.ts` service client falls back to anon key

**What's implemented** (`src/actions/configuration/reset-cash-actions.ts`, line 11):
```ts
process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
```

If `SUPABASE_SERVICE_ROLE_KEY` is not set, this silently falls back to the anon key without any warning. Operations intended to bypass RLS (cash session resets) would then silently execute under RLS and fail in unexpected ways, or worse, succeed with partial data — a correctness and security issue.

---

### 8. `auth-actions.ts` `login()` exposes session tokens in return value

`src/actions/configuration/auth-actions.ts` lines 133–141 also return raw `access_token` and `refresh_token` from the server action return value. Server action return values are serialized through the Next.js server action response channel and reach the client. This duplicates the token-exposure problem in issue 2.

---

### 9. `updateProductSKUAdmin` authorization uses a hardcoded string confirmation code

**What's implemented** (`src/actions/products/update-sku-admin.ts`, lines 35–40):
```ts
if (confirmationCode !== "ADMIN-SKU-CHANGE") {
  return { success: false, error: "Código de confirmación inválido." }
}
```

This is not authentication or authorization. Any caller (including a logged-out attacker who can call the server action) who knows or guesses the string `"ADMIN-SKU-CHANGE"` can change any product SKU. There is no check that the calling user is actually an administrator.

---

## Security Issues by Severity

### Critical

**C1: Middleware uses `getSession()` instead of `getUser()` — unverified session trust**
- File: `src/middleware.ts`, line 44
- An attacker can craft a cookie containing a valid-looking but tampered JWT. `getSession()` reads it without server verification, granting access to all `/dashboard` routes.
- Fix: Replace `supabase.auth.getSession()` with `supabase.auth.getUser()` in middleware.

**C2: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` exposes service role key to browser**
- File: `src/actions/products/update-sku-admin.ts`, line 19
- If the environment variable `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is defined, Next.js bundles it into the client-side JS. This gives any browser user admin-level access to the entire Supabase database, bypassing all RLS.
- Fix: Rename to `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix). Verify the variable is not set in Vercel's public environment variables.

**C3: Unauthenticated destructive API routes (POS mutations)**
- Files: `src/app/api/pos/resync-products/route.ts`, `src/app/api/pos/update-prices/route.ts`, `src/app/api/pos/clean-prices/route.ts`, `src/app/api/pos/fix-customer-names/route.ts`, `src/app/api/pos/fix-customer-names-null/route.ts`
- These routes trigger bulk data mutations with no authentication. Anyone who can reach the server can trigger product syncs, price updates, and data fixes.
- Fix: Add `getCurrentUser()` / `getUser()` checks at the top of each handler; return 401 if unauthenticated.

### High

**H1: Raw JWT tokens returned in API response body and server action return value**
- Files: `src/app/api/auth/login/route.ts` lines 113–116; `src/actions/configuration/auth-actions.ts` lines 133–141; `src/app/login/page.tsx` lines 66–71
- Tokens are accessible to JavaScript (XSS attack surface), visible in browser DevTools Network tab, and stored in fetch response memory. The `@supabase/ssr` cookie-based session should make this unnecessary.
- Fix: Remove `access_token`/`refresh_token` from all return values. Rely solely on the `Set-Cookie` headers that `createServerClient` writes via its `setAll` cookie adapter.

**H2: All `/api/sales/`, `/api/clients/`, `/api/suppliers/` routes have no auth check**
- These routes create invoices, budgets, payments, and expose/modify client and supplier data with no user verification.
- Fix: Add authentication guard using `getCurrentUser()` or direct `supabase.auth.getUser()` at the start of each handler. The middleware explicitly skips all `/api/` routes (line 75 of `middleware.ts`), so route-level guards are mandatory.

**H3: Debug routes expose PII and internal data without authentication**
- Files: All files under `src/app/api/debug/`
- These routes return full database records (client PII, reservation details, supplier contact data) to any unauthenticated caller.
- Fix: Either delete all debug routes (strongly recommended for production) or add admin-only authentication guards. Consider moving them behind an `ADMIN_SECRET` header check at minimum.

**H4: `src/app/api/check-env/route.ts` reveals secret key presence to unauthenticated callers**
- File: `src/app/api/check-env/route.ts`, line 10
- Reveals whether `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `ANTHROPIC_API_KEY` are configured. This is reconnaissance information for an attacker.
- Fix: Delete or gate behind authentication.

**H5: Dashboard layout trusts `getSession()` data for user identity**
- File: `src/app/dashboard/layout.tsx`, lines 25–47
- `session.user` is used to determine user role and access level client-side. This is not server-verified.
- Fix: Replace with `supabase.auth.getUser()` and use the server-verified user object.

### Low

**L1: `supabase-robust.ts` cookie adapter is read-only — sessions cannot be refreshed**
- File: `src/lib/supabase-robust.ts`, lines 14–15
- Sessions using this client will not have their tokens refreshed, causing silent session expiry.
- Fix: Implement the full `getAll`/`setAll` cookie adapter as shown in Supabase docs.

**L2: `reset-cash-actions.ts` silently falls back from service role to anon key**
- File: `src/actions/configuration/reset-cash-actions.ts`, line 11
- Fix: Throw an explicit error if `SUPABASE_SERVICE_ROLE_KEY` is not set, rather than silently falling back.

**L3: Duplicate Supabase client factory implementations**
- Files: `supabase-server.ts`, `supabase-robust.ts`, `auth-actions.ts`, `auth-actions-simple.ts`, `reset-cash-actions.ts` each define their own `createServerClient` call with slightly different cookie adapters.
- This makes auditing and patching difficult and has already led to inconsistent behavior (missing `setAll`, different fallback strategies).
- Fix: Use a single canonical factory from `src/lib/supabase-server.ts` everywhere.

**L4: `updateProductSKUAdmin` uses a hardcoded confirmation string instead of RBAC**
- File: `src/actions/products/update-sku-admin.ts`, lines 35–40
- Fix: Check that `getCurrentUser()` returns a user with `ADMINISTRADOR` or `SUPER_USER` role before performing the operation.

**L5: Multiple `auth-actions.ts` files exist with overlapping responsibilities**
- Files: `auth-actions.ts`, `auth-actions-simple.ts`, `auth-actions-backup.ts`
- The backup file is imported dynamically from the main file for `createUser`/`updateUser`/`deleteUser`. This obscures which auth code path is active and makes security review incomplete.
- Fix: Consolidate into a single authoritative auth actions file.

---

## Remediation

### Immediate (Critical)

**Fix middleware to use `getUser()`:**
```ts
// src/middleware.ts — replace getSession with getUser
const { data: { user }, error } = await supabase.auth.getUser()
const hasValidUser = !!user && !error

if (!hasValidUser && pathname.startsWith('/dashboard')) {
  return NextResponse.redirect(new URL('/login', request.url))
}
if (hasValidUser && pathname === '/login') {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

**Remove `NEXT_PUBLIC_` prefix from service role key reference:**
```ts
// src/actions/products/update-sku-admin.ts line 19
// Change:
process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
// To:
process.env.SUPABASE_SERVICE_ROLE_KEY!,
```
Then audit Vercel environment variable settings to ensure `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is not defined there.

**Add auth guard to all API route handlers** — canonical pattern:
```ts
import { getCurrentUser } from '@/actions/configuration/auth-actions'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest of handler
}
```

Apply this pattern to every route under: `src/app/api/sales/`, `src/app/api/clients/`, `src/app/api/suppliers/`, `src/app/api/pos/`, `src/app/api/purchases/`, `src/app/api/inventory/`, `src/app/api/debug/`, `src/app/api/check-env/`.

### Short-term (High)

**Remove raw JWT tokens from API response and server action return values.** The `@supabase/ssr` login flow already writes session cookies via the `setAll` adapter on `cookieCarrier`. The client `setSession()` call in `login/page.tsx` is unnecessary and dangerous. Delete lines 66–75 of `src/app/login/page.tsx` and lines 19–22 of the `LoginResult` interface and lines 132–141 of `src/actions/configuration/auth-actions.ts`.

**Delete all files under `src/app/api/debug/`** in production, or add an `ADMIN_SECRET` environment variable check before any handler executes.

### Medium-term (Low)

**Fix `supabase-robust.ts` cookie adapter** to implement `getAll` and `setAll`.

**Consolidate Supabase client creation** into `src/lib/supabase-server.ts` and delete local `createServerClient` calls in individual action files.

**Replace hardcoded confirmation code** in `updateProductSKUAdmin` with a proper role check using `getCurrentUser()`.

---

## Files Audited

- `/c/Users/eduar/DJANGO/todoconstructor/src/middleware.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/lib/supabase-server.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/lib/supabase.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/lib/supabase-robust.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/dashboard/layout.tsx`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/login/page.tsx`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/auth/login/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/auth/current-user/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/check-env/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/debug/suppliers/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/debug/check-kunstmann/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/debug/reservation/[id]/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/debug/search-clients/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/debug/check-reservation-117/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/debug/force-calendar-reload/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/sales/invoices/create/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/sales/budgets/create/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/pos/resync-products/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/pos/update-prices/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/app/api/pos/clean-prices/route.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/actions/configuration/auth-actions.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/actions/configuration/auth-actions-simple.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/actions/configuration/reset-cash-actions.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/actions/products/update-sku-admin.ts`
- `/c/Users/eduar/DJANGO/todoconstructor/src/actions/products/update.ts`

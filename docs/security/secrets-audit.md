# Client Secrets Exposure Audit - todoconstructor

**Date:** 2026-03-25
**Scope:** Client-side code, environment files, configuration files, scripts
**Project:** todoconstructor (todoconstructor.cl)

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 2 |
| MEDIUM | 3 |
| LOW | 2 |

---

## CRITICAL Findings

### C1. Supabase S3 Credentials Hardcoded in Client-Side Code

**File:** `src/lib/supabase-s3-config.ts`
**Imported by:** `src/lib/supabase-s3-client.ts` (marked `'use client'`)

The S3 access key and secret access key are hardcoded as fallback values in a file that is imported by a `'use client'` module. This means these credentials will be included in the browser JavaScript bundle.

```
accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '82b8833db8556ae350e2406299b42b67'
secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || 'd1433d5d91db2746aa5dd8aa550d6ef937c85f10ea7b09dd04e833bd57a5f620'
```

Since `SUPABASE_S3_ACCESS_KEY_ID` and `SUPABASE_S3_SECRET_ACCESS_KEY` are not prefixed with `NEXT_PUBLIC_`, they will be `undefined` at runtime in the client bundle, causing the hardcoded fallbacks to always be used. Anyone inspecting the browser bundle or network requests can extract these S3 credentials.

**Impact:** Full read/write access to Supabase Storage buckets (products, clients, website images).

**Remediation:**
1. Remove all hardcoded S3 credentials from `supabase-s3-config.ts`.
2. Move the S3 client to server-side only (remove `'use client'` from `supabase-s3-client.ts`).
3. Create server actions for file upload/download operations.
4. If client-side uploads are needed, use Supabase Storage JS client with the anon key (already done in `supabase-storage.ts`), not raw S3 credentials.

---

### C2. Service Role Keys Hardcoded in 40+ Script Files

**Directory:** `scripts/` (NOT gitignored)

At least 40 script files contain hardcoded Supabase service role keys from multiple Supabase projects. These keys are embedded as string literals, not read from environment variables. Examples:

- `scripts/check-current-sessions.js` -- hardcoded service role key
- `scripts/check-cash-session-status.js` -- hardcoded service role key
- `scripts/check-product-252-category.js` -- hardcoded service role key
- `scripts/check-income-records.js` -- hardcoded service role key
- Many others (40+ files total)

Multiple different Supabase project keys are exposed, including keys for at least 3 different Supabase instances (refs: `oojczqgarhyxcrrxjsiy`, `bvzfuibqlprrfbudnauc`, `ibpbclxszblyswffxzn`, `flwewxqgbmsyqrjvhfuw`).

**Impact:** If these scripts are pushed to a public or shared repository, all service role keys for multiple Supabase projects are compromised. Service role keys bypass RLS entirely.

**Remediation:**
1. Add `scripts/` to `.gitignore` or create a `.env` pattern for scripts.
2. Replace all hardcoded keys with `process.env.SUPABASE_SERVICE_ROLE_KEY`.
3. Rotate ALL exposed service role keys in Supabase dashboard immediately.
4. Audit git history for committed secrets (even if removed now, they persist in history).

---

### C3. `.mcp.json` Contains Service Role Key and Is Not Gitignored

**File:** `.mcp.json`

The MCP server configuration file contains the Supabase service role key in plaintext:

```json
"SUPABASE_SERVICE_ROLE_KEY": "eyJhbG..."
```

This file is NOT listed in `.gitignore`. The `.gitignore` covers `.env*` files but not `.mcp.json`.

**Impact:** If committed to the repository, the service role key is exposed to anyone with repo access.

**Remediation:**
1. Add `.mcp.json` to `.gitignore` immediately.
2. Remove it from git tracking: `git rm --cached .mcp.json`
3. Rotate the service role key.

---

## HIGH Findings

### H1. API Key Partial Exposure in Test Route

**File:** `src/app/api/emails/test-openai/route.ts` (line 9)

The route logs the first 20 characters of the OpenAI API key to server logs:

```typescript
console.log('OPENAI_API_KEY:', openaiKey ? `Configurada (${openaiKey.slice(0, 20)}...)` : 'No configurada');
```

While this is server-side only, log aggregation services or error monitoring tools could capture partial key values.

**Remediation:** Remove the key slice from logs. Only log whether the key is present (boolean), never any portion of the actual value.

---

### H2. Deployment Scripts Contain Hardcoded Keys

**Files:** `scripts/set-env-vars.ps1`, `scripts/update-vercel-env.ps1`, `scripts/vercel-deploy.ps1`, `scripts/fix-vercel-env.js`

PowerShell and JS deployment scripts contain hardcoded Supabase keys (both anon and service role). These are deployment automation scripts that should use environment variables or a secrets manager.

**Remediation:** Replace hardcoded values with references to a local `.env` file or a secrets manager.

---

## MEDIUM Findings

### M1. `verify-env.ts` Logs Partial Secret Values

**File:** `src/lib/verify-env.ts`

The function logs the first 10 characters of every environment variable, including `SUPABASE_SERVICE_ROLE_KEY`:

```typescript
console.log(`${key}: ${value.substring(0, 10)}...`);
```

**Remediation:** For secret variables, only log whether they are defined, not any portion of the value.

---

### M2. Test Page References `SUPABASE_SERVICE_ROLE_KEY` in Client-Accessible Context

**File:** `src/disabled/test-routes/test-supabase/page.tsx` (lines 82-84)

Although this page is under `disabled/` and is a server component, it references `process.env.SUPABASE_SERVICE_ROLE_KEY` in a way that could expose its presence status in rendered HTML. The value itself is not exposed, only a boolean check.

**Remediation:** Remove or ensure these debug pages are never deployed. Consider deleting the `disabled/` directory entirely.

---

### M3. Non-NEXT_PUBLIC Environment Variables Used in Server-Only Contexts Without Guards

**Files:** Multiple files in `src/lib/` and `src/actions/`

Variables like `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` are correctly used server-side. However, there is no compile-time guard ensuring these modules cannot be imported from client components. If a developer accidentally imports a server action module from a client component, Next.js tree-shaking may not prevent leakage.

**Remediation:** Add `import 'server-only'` at the top of all files that use secret environment variables:
- `src/lib/supabase-server.ts`
- `src/lib/email-service.ts`
- `src/lib/email-reader-service.ts`
- `src/lib/anthropic-client.ts`
- `src/lib/openai-client.ts`
- `src/lib/product-embeddings.ts`

---

## LOW Findings

### L1. `.env.local` Is Properly Gitignored

**File:** `.env.local`

The `.gitignore` includes `.env*`, which covers `.env.local`. This is correct. However, the `.env.local` file contains the service role key -- verify it has never been committed in git history.

---

### L2. `check-env` API Route Exposes Environment Variable Presence

**File:** `src/app/api/check-env/route.ts`

This public API endpoint reveals which API keys are configured (as booleans, not values). While not directly dangerous, it provides reconnaissance information to attackers about which services are in use.

**Remediation:** Protect this endpoint with authentication or remove it from production builds.

---

## Positive Findings

1. **Client-side Supabase client** (`src/lib/supabase.ts`) correctly uses only `NEXT_PUBLIC_` prefixed variables.
2. **Server-side Supabase client** (`src/lib/supabase-server.ts`) correctly separates anon key and service role key usage.
3. **Email service** (`src/lib/email-service.ts`) correctly reads credentials from environment variables without hardcoding.
4. **AI clients** (`src/lib/anthropic-client.ts`, `src/lib/openai-client.ts`) correctly use `process.env` for API keys.
5. **`next.config.js`** does not expose any secrets through webpack configuration.
6. **`.env.local`** is covered by `.gitignore`.

---

## Priority Action Items

| Priority | Action | Effort |
|----------|--------|--------|
| 1 | Remove hardcoded S3 credentials from `supabase-s3-config.ts` and make `supabase-s3-client.ts` server-only | 1-2 hours |
| 2 | Add `.mcp.json` to `.gitignore` and remove from git tracking | 5 minutes |
| 3 | Add `scripts/` to `.gitignore` or remove hardcoded keys from all scripts | 1-2 hours |
| 4 | Rotate ALL exposed Supabase service role keys (at least 4 different projects) | 30 minutes |
| 5 | Add `import 'server-only'` to all server-side lib files with secrets | 30 minutes |
| 6 | Remove or protect debug/test API routes (`check-env`, `test-openai`) | 30 minutes |
| 7 | Audit git history for previously committed secrets | 1 hour |

---

## Files Referenced

- `C:\Users\eduar\DJANGO\todoconstructor\src\lib\supabase-s3-config.ts`
- `C:\Users\eduar\DJANGO\todoconstructor\src\lib\supabase-s3-client.ts`
- `C:\Users\eduar\DJANGO\todoconstructor\.mcp.json`
- `C:\Users\eduar\DJANGO\todoconstructor\.env.local`
- `C:\Users\eduar\DJANGO\todoconstructor\.gitignore`
- `C:\Users\eduar\DJANGO\todoconstructor\scripts\` (40+ files)
- `C:\Users\eduar\DJANGO\todoconstructor\src\app\api\check-env\route.ts`
- `C:\Users\eduar\DJANGO\todoconstructor\src\app\api\emails\test-openai\route.ts`
- `C:\Users\eduar\DJANGO\todoconstructor\src\lib\verify-env.ts`
- `C:\Users\eduar\DJANGO\todoconstructor\src\lib\supabase-server.ts`
- `C:\Users\eduar\DJANGO\todoconstructor\src\lib\supabase.ts`
- `C:\Users\eduar\DJANGO\todoconstructor\src\disabled\test-routes\test-supabase\page.tsx`

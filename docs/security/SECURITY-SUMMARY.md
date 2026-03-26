# Security Meta-Analysis Report

**Analysis Date**: 2026-03-25
**Reports Analyzed**: 5 (auth-audit, secrets-audit, input-validation-audit, dependency-audit, rls-audit)
**Total Unique Vulnerabilities**: 58
**Systemic Issues Identified**: 7

---

## Executive Summary

### Risk Overview
- **Critical Systemic Issues**: 4
- **Architectural Concerns**: 5
- **Quick Wins Available**: 6
- **Estimated Total Remediation Effort**: 25-35 person-days

### Top 3 Systemic Vulnerabilities

1. **Unauthenticated API access** -- Found in 4 reports (auth, input-validation, dependency, rls), affects 30+ route files. The middleware explicitly excludes all `/api/` routes, and individual route handlers almost never check authentication.
2. **Database-wide RLS failure** -- Found in 1 report but impacts every layer. 13+ tables have no RLS; 21+ tables have `TO public USING (true)` policies that grant anonymous full CRUD. Combined with the exposed anon key in the frontend, any person on the internet can read/write financial, PII, and business data.
3. **Service role key exposure through multiple vectors** -- Found in 3 reports (auth, secrets, dependency). Hardcoded in 40+ script files, exposed via `NEXT_PUBLIC_` prefix in code, embedded in `.mcp.json` (not gitignored), and present in deployment scripts. This key bypasses all RLS.

### Overall Security Posture: CRITICAL

The project has a functioning authentication system but almost no authorization enforcement. The gap between "user is logged in" and "user is allowed to do this" is the central architectural failure.

---

## Cross-Cutting Security Concerns

### 1. No Authentication on API Routes -- CRITICAL

**Found in Reports**: auth-audit (C3, H2, H3, H4), input-validation-audit (items 1-13, 30-35), dependency-audit (H1)
**Affected Files**: 30+ files across `src/app/api/`
**Root Cause**: Architectural decision -- middleware matcher on line 75 of `src/middleware.ts` explicitly excludes `/api/` routes via regex pattern `(?!...api/...)`. No alternative authentication layer exists for API routes.

**Instances (partial list)**:
- `src/app/api/pos/resync-products/route.ts` -- destructive mutation, no auth
- `src/app/api/pos/update-prices/route.ts` -- destructive mutation, no auth
- `src/app/api/pos/clean-prices/route.ts` -- destructive mutation, no auth
- `src/app/api/sales/invoices/create/route.ts` -- financial mutation, no auth
- `src/app/api/sales/budgets/create/route.ts` -- financial mutation, no auth
- `src/app/api/sales/payments/create/route.ts` -- financial mutation, no auth
- `src/app/api/purchases/payments/create/route.ts` -- financial mutation, no auth
- `src/app/api/clients/route.ts` -- PII access, no auth
- `src/app/api/suppliers/route.ts` -- business data, no auth
- `src/app/api/odoo/sync/route.ts` -- triggers full sync, no auth
- `src/app/api/products/edit/route.ts` -- product mutation, no auth
- `src/app/api/debug/*` (6 routes) -- internal data exposure, no auth
- `src/app/api/check-env/route.ts` -- reconnaissance, no auth

**Systemic Fix**: Instead of adding auth checks to each route individually, create an authentication wrapper and apply it uniformly.

**Implementation**:
```typescript
// src/lib/api-auth.ts
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function requireAuth() {
  const supabase = await createRouteHandlerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) {
    return { user: null, error: 'Unauthorized' }
  }
  return { user, error: null }
}

// Usage in every route handler:
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return NextResponse.json({ error }, { status: 401 })
  // ... handler logic
}
```

Additionally, consider removing the `/api/` exclusion from the middleware matcher so that session refresh still occurs on API requests.

---

### 2. RLS Effectively Disabled Across the Database -- CRITICAL

**Found in Reports**: rls-audit (V-001, V-002, V-003, V-006, V-007)
**Affected Tables**: 34+ of ~55 tables (13 with no RLS, 21 with `USING(true)` policies)
**Root Cause**: Two compounding issues -- (a) many tables never had RLS enabled, (b) tables that do have RLS use `TO public USING (true)` which grants anonymous access, making RLS meaningless.

**Most Critical Unprotected Tables** (financial/PII data, no RLS at all):
- `reservations` -- guest names, emails, phones, billing RUT, amounts
- `payments` -- payment amounts, methods
- `invoices` / `invoice_lines` / `invoice_payments` -- full invoice data
- `purchase_invoices` / `purchase_invoice_lines` -- supplier invoice data
- `SupplierPayment` -- payment amounts, bank references, bank accounts
- `companies` / `company_contacts` -- company RUT, credit limits, contact emails

**Tables with RLS that Grants Anonymous Full Access** (21 tables including):
- `Client` -- `FOR ALL TO public USING (true)`
- `modular_reservations` -- `FOR ALL TO public USING (true)`
- `Supplier` -- conflicting policies, permissive ones override restrictive ones
- `Product` -- `FOR ALL TO authenticated USING (true)`

**Compounding Factor**: The remote schema grants `SELECT, INSERT, UPDATE, DELETE, TRUNCATE` to the `anon` role on virtually every table. Combined with no RLS or `USING(true)` policies, the anon key (which is public in the frontend) provides unrestricted database access.

**Systemic Fix**: A migration that enables RLS on all tables, revokes anon grants, and applies role-based policies.

**Implementation (priority SQL)**:
```sql
-- Phase 1: Immediately protect financial tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'reservations', 'payments', 'invoices', 'invoice_lines',
    'invoice_payments', 'SupplierPayment', 'purchase_invoices',
    'purchase_invoice_lines', 'companies', 'company_contacts'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY "authenticated_access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

-- Phase 2: Revoke anon grants
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
-- Re-grant only on truly public tables if any exist

-- Phase 3: Fix User table self-role-modification (V-006)
DROP POLICY IF EXISTS "Enable update for own profile" ON "User";
CREATE POLICY "Users update own profile no role change" ON "User"
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND "roleId" = (SELECT "roleId" FROM "User" WHERE id = auth.uid())
  );
```

---

### 3. Service Role Key Exposed Through Multiple Vectors -- CRITICAL

**Found in Reports**: auth-audit (C2), secrets-audit (C1, C2, C3, H2), dependency-audit (C2)
**Exposure Vectors**:

| Vector | File(s) | Severity |
|--------|---------|----------|
| `NEXT_PUBLIC_` prefix in code | `src/actions/products/update-sku-admin.ts` line 19 | CRITICAL -- bundled into browser JS |
| 40+ scripts with hardcoded keys | `scripts/*.js` (not gitignored) | CRITICAL -- keys for 4 Supabase projects |
| `.mcp.json` not gitignored | `.mcp.json` | CRITICAL -- committed to repo |
| Hardcoded S3 credentials in client code | `src/lib/supabase-s3-config.ts` | CRITICAL -- always uses fallback in browser |
| Deployment scripts | `scripts/set-env-vars.ps1`, `scripts/update-vercel-env.ps1` | HIGH |
| Partial key logging | `src/lib/verify-env.ts`, `src/app/api/emails/test-openai/route.ts` | MEDIUM |

**Root Cause**: No secret management discipline. Environment variables are copy-pasted into scripts, config files, and code instead of being read from a secure source at runtime.

**Systemic Fix**:
1. Immediately rotate ALL Supabase service role keys (at least 4 projects: `oojczqgarhyxcrrxjsiy`, `bvzfuibqlprrfbudnauc`, `ibpbclxszblyswffxzn`, `flwewxqgbmsyqrjvhfuw`)
2. Add to `.gitignore`: `.mcp.json`, and audit `scripts/` directory
3. Rename `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` to `SUPABASE_SERVICE_ROLE_KEY` in all code
4. Remove hardcoded S3 credential fallbacks from `supabase-s3-config.ts`
5. Make `supabase-s3-client.ts` server-only (remove `'use client'`)
6. Add `import 'server-only'` to all server-side files that use secret env vars
7. Replace all hardcoded keys in scripts with `require('dotenv').config()` + `process.env.*`

---

### 4. getSession() Used Instead of getUser() -- HIGH

**Found in Reports**: auth-audit (C1, H5)
**Affected Files**: `src/middleware.ts` line 44, `src/app/dashboard/layout.tsx` lines 25-47
**Root Cause**: Knowledge gap -- Supabase documentation explicitly warns against trusting `getSession()` on the server side, but the project's primary auth gate (middleware) and main layout use it.

**Impact**: The middleware is the only protection for all `/dashboard` routes. Because `getSession()` reads the JWT from the cookie without server validation, a tampered or expired token would pass the check and grant access to the entire dashboard.

**Fix**: Replace `getSession()` with `getUser()` in middleware and dashboard layout. This is a two-file change.

---

### 5. No Input Validation Framework -- HIGH

**Found in Reports**: input-validation-audit (all findings)
**Scale**: 47 endpoints/actions audited; 13 have zero validation, 22 have partial validation
**Root Cause**: Zod is installed (used in `src/lib/invoice-extraction.schema.ts` for AI responses) but never used for API input validation. All validation is ad-hoc `if` checks.

**Key Anti-Patterns**:
- TypeScript type assertions used as runtime validation: `const input: CreateBudgetInput = body`
- No numeric range checks on financial fields (quantity, unit_price, discount_percent, amount)
- No string length limits on free-text fields (notes, comments)
- No enum/allowlist validation on status fields (payment_method, status, tipoCliente)
- No file type or size validation on upload endpoints
- No `pageSize` upper bound on list endpoints

**Systemic Fix**: Create Zod schemas co-located with actions, validate at the route boundary.

```typescript
// src/schemas/sales.ts
import { z } from 'zod'

export const CreateInvoiceSchema = z.object({
  client_id: z.number().int().positive(),
  number: z.string().min(1).max(50),
  status: z.enum(['draft', 'sent', 'paid', 'cancelled']),
  lines: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unit_price: z.number().min(0),
    discount_percent: z.number().min(0).max(100),
  })).min(1),
})

// In route handler:
const parsed = CreateInvoiceSchema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
}
```

---

### 6. Debug/Test Routes in Production -- HIGH

**Found in Reports**: auth-audit (H3, H4), input-validation-audit (items 13, 30-31), dependency-audit (H1)
**Affected Routes**: At least 15 debug/test endpoints deployed to production

| Route | Exposed Data |
|-------|-------------|
| `/api/debug/suppliers` | All supplier PII (email, phone, city) |
| `/api/debug/check-kunstmann` | Full supplier records |
| `/api/debug/reservation/[id]` | Full reservation + client PII |
| `/api/debug/search-clients` | Client search + env info |
| `/api/debug/check-reservation-117` | Specific reservation data |
| `/api/debug/force-calendar-reload` | Cache manipulation |
| `/api/check-env` | Secret key presence flags |
| `/api/test` | Database schema + table counts |
| `/api/debug-pos-sync` | POS sync internals |
| `/api/debug-pos` | POS data |
| `/api/products/debug` | Product debug data |
| `/api/products/debug/[id]` | Product debug data |
| `/api/emails/debug-analyze` | Email analysis internals |
| `/api/whatsapp/debug` | WhatsApp internals |
| `/api/whatsapp/test-message` | Triggers WhatsApp message |

**Fix**: Delete all debug routes or move them to `src/disabled/`. If any must remain, gate them with:
```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not available' }, { status: 404 })
}
```

---

### 7. Vulnerable/Unmaintained Dependencies -- MEDIUM

**Found in Reports**: dependency-audit (all findings)
**Key Packages**:

| Package | Issue | Replacement |
|---------|-------|-------------|
| `xlsx` 0.18.5 | Prototype pollution CVEs, deprecated | `exceljs` (already installed) |
| `imap` 0.8.19 | Unmaintained since 2014, outdated TLS | `imapflow` |
| `pdf-parse` 1.1.1 | Unmaintained since 2021, arbitrary JS exec | `pdfjs-dist` (already installed) |
| `html2canvas` 1.4.1 | XSS on untrusted content | `html-to-image` |
| `puppeteer` 24.12.1 | 300MB Chromium, SSRF risk | Evaluate necessity |
| `whatsapp-web.js` 1.31.0 | Against WhatsApp ToS, session hijack risk | WhatsApp Business API |

---

## Vulnerability Heat Map

### High-Risk Areas (Multiple Critical Issues)

| Directory / Area | Critical | High | Medium | Low | Risk Score |
|------------------|----------|------|--------|-----|------------|
| `src/app/api/` (all routes) | 3 | 4 | 3 | 0 | **95/100** |
| Supabase RLS (database layer) | 3 | 3 | 3 | 0 | **93/100** |
| `scripts/` (hardcoded secrets) | 2 | 1 | 0 | 0 | **88/100** |
| `src/lib/supabase-s3-*` | 1 | 0 | 0 | 0 | **85/100** |
| `src/middleware.ts` | 1 | 0 | 0 | 0 | **82/100** |
| `src/actions/products/update-sku-admin.ts` | 1 | 0 | 0 | 1 | **80/100** |
| `src/actions/configuration/auth-actions.ts` | 0 | 1 | 0 | 2 | **55/100** |
| `src/app/login/page.tsx` | 0 | 1 | 0 | 0 | **50/100** |
| Dependencies (package.json) | 1 | 2 | 4 | 4 | **48/100** |

### Most Vulnerable Files (Appearing Across Multiple Reports)

1. `src/actions/products/update-sku-admin.ts` -- 3 reports (auth C2, secrets via NEXT_PUBLIC, dependency C2): service role key exposure + hardcoded confirmation code
2. `src/middleware.ts` -- 2 reports (auth C1, input-validation): uses getSession(), excludes /api/ routes
3. `src/app/api/check-env/route.ts` -- 3 reports (auth H4, input-validation item 13, dependency H1): no auth, reconnaissance exposure
4. `src/lib/supabase-s3-config.ts` -- 1 report (secrets C1): hardcoded S3 credentials in client bundle
5. `src/app/api/debug/*` routes -- 3 reports (auth H3, input-validation items 30-31, dependency H1): PII exposure without auth

---

## Root Cause Analysis

### Architecture Issues

#### A1. Missing Security Middleware Layer
The middleware (`src/middleware.ts`) is the project's only centralized security gate, but it explicitly excludes all API routes via the matcher pattern. This means the project has **no centralized security layer for its API**. Each of the 30+ API routes must implement its own authentication -- and most do not.

#### A2. No Authorization Model
Even where authentication exists (via `getCurrentUser()`), there is no authorization framework. The project has a role system (`SUPER_USER`, `ADMINISTRADOR`, `JEFE_SECCION`, `USUARIO_FINAL`) in the database, but API routes never check user roles. The only role-based check found was a hardcoded string comparison (`"ADMIN-SKU-CHANGE"`).

#### A3. Dual-Path Authentication Creates Confusion
The project has two authentication paths: (a) cookie-based via `@supabase/ssr` which is correct, and (b) raw JWT tokens returned in API responses and server action return values which is dangerous. This duplication causes confusion and exposes tokens to XSS.

#### A4. Multiple Supabase Client Factories
At least 5 different files create Supabase server clients with different cookie adapters: `supabase-server.ts`, `supabase-robust.ts`, `auth-actions.ts`, `auth-actions-simple.ts`, `reset-cash-actions.ts`. The `supabase-robust.ts` variant is read-only (missing `setAll`), causing silent session refresh failures. This fragmentation makes it impossible to audit or fix auth behavior in one place.

### Knowledge Gaps

#### K1. getSession() vs getUser() Confusion
Supabase documentation explicitly warns against trusting `getSession()` server-side. The project uses it in its two most critical auth checkpoints (middleware and dashboard layout).

#### K2. NEXT_PUBLIC_ Prefix Misunderstanding
The `NEXT_PUBLIC_` prefix on `SUPABASE_SERVICE_ROLE_KEY` suggests a misunderstanding of Next.js environment variable scoping. Variables with this prefix are inlined into browser JavaScript at build time.

#### K3. RLS Policy Semantics Misunderstood
Many policies are named "Enable all for service role" but use `TO public` which applies to all roles including anonymous. The naming suggests the developer believed `public` meant something different than its actual Supabase/PostgreSQL meaning.

#### K4. TypeScript Types Used as Runtime Validation
Multiple routes cast request bodies to TypeScript interfaces and treat this as validation. TypeScript types are erased at compile time and provide zero runtime protection.

---

## Prioritized Remediation Roadmap

### Phase 0: Emergency Actions (Day 1) -- STOP THE BLEEDING
**Effort**: 2-3 hours
**Risk Reduction**: 40%

These actions address active data exposure that can be exploited right now by anyone with the Supabase anon key (which is public in the frontend bundle).

1. **Rotate ALL exposed Supabase service role keys**
   - At least 4 Supabase projects have keys in script files
   - Go to each Supabase dashboard > Settings > API > Rotate service role key
   - Update `.env.local` and Vercel environment variables with new keys
   - Time: 30 minutes

2. **Enable RLS on critical financial tables** (single SQL migration)
   - Tables: `reservations`, `payments`, `invoices`, `invoice_lines`, `invoice_payments`, `SupplierPayment`, `purchase_invoices`, `purchase_invoice_lines`, `companies`, `company_contacts`
   - Apply `FOR ALL TO authenticated USING (true)` as a minimum gate
   - Time: 30 minutes

3. **Add `.mcp.json` to `.gitignore` and remove from tracking**
   - `echo ".mcp.json" >> .gitignore && git rm --cached .mcp.json`
   - Time: 5 minutes

4. **Fix `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`**
   - In `src/actions/products/update-sku-admin.ts` line 19: change to `process.env.SUPABASE_SERVICE_ROLE_KEY!`
   - Verify Vercel does not have `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` set
   - Time: 15 minutes

5. **Remove hardcoded S3 credential fallbacks**
   - In `src/lib/supabase-s3-config.ts`: remove the `|| 'hardcoded_key'` fallbacks
   - Make `src/lib/supabase-s3-client.ts` server-only (add `import 'server-only'`)
   - Time: 15 minutes

### Phase 1: Critical Security Fixes (Week 1)
**Effort**: 5-7 developer days
**Risk Reduction**: 35%

1. **Fix middleware to use `getUser()` instead of `getSession()`**
   - File: `src/middleware.ts` line 44
   - Replace `supabase.auth.getSession()` with `supabase.auth.getUser()`
   - Test: full login/logout/session-expiry flow
   - Time: 1 hour

2. **Add authentication to all API route handlers**
   - Create `src/lib/api-auth.ts` with `requireAuth()` helper
   - Apply to all 30+ routes in `src/app/api/`
   - Priority order: POS mutations > sales > purchases > clients > suppliers > others
   - Time: 2-3 days

3. **Delete or disable all debug routes**
   - Move all `src/app/api/debug/` routes to `src/disabled/`
   - Delete `src/app/api/check-env/route.ts`
   - Delete `src/app/api/test/route.ts`
   - Time: 1 hour

4. **Fix User table self-role-modification vulnerability (V-006)**
   - Add `WITH CHECK` that prevents `roleId` changes
   - Time: 30 minutes

5. **Remove raw JWT tokens from API responses and server action returns**
   - Remove token fields from `src/app/api/auth/login/route.ts` response
   - Remove token fields from `src/actions/configuration/auth-actions.ts` return
   - Remove `setSession()` call from `src/app/login/page.tsx`
   - Time: 2 hours

6. **Fix RLS policies: replace `TO public` with `TO authenticated`**
   - Affects 21+ tables with `USING(true)` policies
   - Single migration to drop and recreate policies
   - Time: 1 day

7. **Revoke excessive anon grants**
   - `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;`
   - Re-grant SELECT only on truly public tables (if any)
   - Time: 1 hour

### Phase 2: Security Infrastructure (Weeks 2-3)
**Effort**: 5-8 developer days
**Risk Reduction**: 15%

1. **Implement Zod validation on all mutation endpoints**
   - Create schema files in `src/schemas/`
   - Priority: financial endpoints (sales, purchases, payments) first
   - Time: 3-4 days

2. **Consolidate Supabase client creation**
   - Single factory in `src/lib/supabase-server.ts`
   - Remove local `createServerClient` calls in action files
   - Fix `supabase-robust.ts` cookie adapter (add `setAll`)
   - Time: 1 day

3. **Add `import 'server-only'` guards**
   - Files: `supabase-server.ts`, `email-service.ts`, `email-reader-service.ts`, `anthropic-client.ts`, `openai-client.ts`, `product-embeddings.ts`
   - Time: 30 minutes

4. **Replace vulnerable dependencies**
   - Remove `xlsx`, use `exceljs` (already installed)
   - Replace `imap` with `imapflow`
   - Replace `pdf-parse` with direct `pdfjs-dist` usage
   - Move `@types/*` to devDependencies
   - Time: 1-2 days

5. **Clean up script files**
   - Remove all hardcoded keys from `scripts/`
   - Replace with `dotenv` + `process.env` pattern
   - Add `scripts/` to `.gitignore` or create a `.env.scripts` pattern
   - Time: 1 day

### Phase 3: Hardening and Standardization (Weeks 4-6)
**Effort**: 5-10 developer days
**Risk Reduction**: 10%

1. **Implement role-based authorization middleware**
   - Create `requireRole('ADMINISTRADOR')` helper
   - Apply to admin-only routes (POS, configuration, user management)
   - Replace hardcoded confirmation code in `update-sku-admin.ts`
   - Time: 2 days

2. **Standardize RLS role checking**
   - Use `get_user_role()` function consistently in all policies
   - Fix broken role checks in AI training tables (V-004, V-005)
   - Add policies for tables with RLS but no policies (Cost_Center, POSConfig, POSSale, POSSaleItem)
   - Time: 2 days

3. **Add file upload validation**
   - MIME type allowlists for PDF and Excel uploads
   - File size limits at the route layer
   - Affected: `/api/purchases/process-pdf`, `/api/clients/import`, `/api/inventory/physical/import`
   - Time: 1 day

4. **Consolidate auth action files**
   - Merge `auth-actions.ts`, `auth-actions-simple.ts`, `auth-actions-backup.ts`
   - Single authoritative file
   - Time: 1 day

5. **Add security headers and rate limiting**
   - Security headers in middleware (X-Frame-Options, X-Content-Type-Options, etc.)
   - Rate limiting on auth endpoints (login, password reset)
   - Time: 1-2 days

6. **Create `.github/CODEOWNERS`**
   - Require review on `src/lib/supabase*`, `src/middleware.ts`, `src/app/api/**`, `package.json`, `supabase/migrations/`
   - Time: 30 minutes

---

## Quick Wins (Can Be Done Immediately)

### 1. Add .mcp.json to .gitignore
**Time**: 2 minutes | **Impact**: Prevents service role key from being committed
```bash
echo ".mcp.json" >> .gitignore
git rm --cached .mcp.json 2>/dev/null
```

### 2. Fix NEXT_PUBLIC_ Service Role Key Reference
**Time**: 5 minutes | **Impact**: Prevents service role key from being bundled into browser JS
```
In src/actions/products/update-sku-admin.ts line 19:
Change: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
To:     process.env.SUPABASE_SERVICE_ROLE_KEY!
```

### 3. Fix Middleware getSession to getUser
**Time**: 10 minutes | **Impact**: Fixes the primary auth gate for all /dashboard routes
```
In src/middleware.ts line 44:
Change: const { data: { session }, error } = await supabase.auth.getSession()
To:     const { data: { user }, error } = await supabase.auth.getUser()
Update: hasSupabaseSession = !!user && !error
```

### 4. Remove S3 Hardcoded Fallbacks
**Time**: 10 minutes | **Impact**: Prevents S3 credentials from appearing in browser bundle
```
In src/lib/supabase-s3-config.ts:
Remove the || 'hardcoded_key' fallback values
Add 'use server' or import 'server-only' to supabase-s3-client.ts
```

### 5. Delete Debug Routes
**Time**: 15 minutes | **Impact**: Eliminates 15 unauthenticated data exposure endpoints
```bash
rm -rf src/app/api/debug/
rm src/app/api/check-env/route.ts
rm src/app/api/test/route.ts
```

### 6. Enable RLS on Financial Tables
**Time**: 15 minutes | **Impact**: Blocks anonymous access to payments, invoices, reservations
```sql
-- Run in Supabase SQL Editor
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupplierPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

-- Minimum policy: allow authenticated users
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'reservations','payments','invoices','invoice_lines',
    'invoice_payments','SupplierPayment','purchase_invoices',
    'purchase_invoice_lines','companies','company_contacts'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY "auth_access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t
    );
  END LOOP;
END $$;
```

---

## Compliance and Standards Gaps

### OWASP Top 10 Coverage

| OWASP Category | Status | Notes |
|----------------|--------|-------|
| A01 Broken Access Control | FAILING | No auth on API routes, RLS disabled, self-role-modification |
| A02 Cryptographic Failures | PARTIAL | JWT tokens exposed in responses, S3 keys hardcoded |
| A03 Injection | AT RISK | No input validation framework, but Supabase parameterizes queries |
| A04 Insecure Design | FAILING | No security architecture (missing middleware, no auth layer) |
| A05 Security Misconfiguration | FAILING | Debug routes in production, excessive anon grants, missing RLS |
| A06 Vulnerable Components | AT RISK | xlsx, imap, pdf-parse unmaintained with known CVEs |
| A07 Auth Failures | FAILING | getSession() trust, token exposure, no rate limiting |
| A08 Data Integrity Failures | AT RISK | No input validation on financial mutations |
| A09 Logging Failures | FAILING | No audit logging, partial key values in logs |
| A10 SSRF | AT RISK | Puppeteer installed, potential for user-controlled URLs |

### Framework Features Not Used
- Next.js `server-only` package (prevents server code from being imported client-side)
- Supabase RLS (enabled but ineffective on most tables)
- Zod (installed but not used for API validation)
- Next.js middleware (configured but excludes API routes)

---

## Security Metrics

### Current Security Posture
- **Security Score**: 18/100 (Critical)
- **Critical Vulnerabilities**: 10 (across all reports)
- **High Vulnerabilities**: 14
- **Medium Vulnerabilities**: 13
- **Tables with Effective RLS**: ~5 of ~55 (9%)
- **API Routes with Auth**: ~3 of ~30 (10%)
- **Input Validation Coverage**: 12 of 47 endpoints (26%)

### Target Security Posture (After Full Remediation)
- **Security Score**: 82/100 (Good)
- **Critical Vulnerabilities**: 0
- **High Vulnerabilities**: 0
- **Tables with Effective RLS**: 55 of 55 (100%)
- **API Routes with Auth**: 30 of 30 (100%)
- **Input Validation Coverage**: 47 of 47 (100%)

### After Phase 0 + Phase 1 Only
- **Security Score**: 60/100 (Moderate)
- **Critical Vulnerabilities**: 0
- **High Vulnerabilities**: 2-3 remaining
- **Risk Reduction**: 75% of total exposure eliminated

---

## Cost-Benefit Analysis

### Investment Required
- **Developer Time**: 25-35 person-days total (Phase 0-3)
- **Phase 0 alone**: 2-3 hours (highest ROI)
- **Phase 0 + 1**: 6-8 days (eliminates all critical issues)
- **Infrastructure Cost**: Minimal (no new services needed)

### Current Risk Exposure
- **Data at Risk**: All customer PII, financial records, supplier data, payment information
- **Attack Complexity**: Trivial -- anon key is in the frontend, no auth on API routes, no effective RLS
- **Regulatory**: Potential GDPR/privacy violations with exposed PII (guest names, emails, phones, RUT)
- **Business Impact**: Complete database compromise possible with browser DevTools

### ROI of Phase 0 (3 hours of work)
- Rotates compromised keys (blocks all existing leaked key usage)
- Enables RLS on financial tables (blocks anonymous data access)
- Fixes service role key client exposure (blocks RLS bypass from browser)
- **This single action eliminates the ability for an anonymous attacker to read/write all database records**

---

## Conclusion

The todoconstructor project has **critical, actively exploitable security vulnerabilities** that require immediate attention. The three compounding issues are:

1. **The Supabase anon key is public** (by design, in the frontend) -- this is normal and expected
2. **RLS is ineffective** on 90% of tables -- this means the anon key grants full database access
3. **API routes have no authentication** -- this means any HTTP request can trigger business logic mutations

Together, these create a situation where **any person on the internet can read, modify, or delete all business data** including financial records, customer PII, and system configuration -- without needing any credentials beyond the publicly visible anon key.

The good news: **Phase 0 can be completed in 2-3 hours** and eliminates the most critical exposure. Phase 1 (one week) closes all critical and high-severity issues. The fixes are straightforward and do not require architectural redesign -- they require applying existing Supabase and Next.js security features that are currently misconfigured or unused.

**Immediate next step**: Execute Phase 0 today. Start with key rotation and RLS enablement on financial tables.

---

## Appendix: Report Cross-Reference Matrix

| Vulnerability | Auth Audit | Secrets Audit | Input Val. | Dependency | RLS Audit |
|--------------|:----------:|:-------------:|:----------:|:----------:|:---------:|
| No auth on API routes | C3, H2, H3 | | 1-13 | H1 | |
| Service role key exposure | C2 | C2, C3, H2 | | C2 | |
| S3 credentials in client code | | C1 | | | |
| getSession() instead of getUser() | C1, H5 | | | | |
| Raw JWT tokens in responses | H1 | | | | |
| RLS disabled / ineffective | | | | | V-001, V-002 |
| Anonymous DB access | | | | | V-001, V-002, V-007 |
| Self-role-modification | | | | | V-006 |
| No input validation | | | All findings | | |
| Debug routes in production | H3, H4 | L2 | 13, 30-31 | H1 | |
| Vulnerable dependencies | | | | C1, H2, H3 | |
| Broken RLS role checks | | | | | V-004, V-005 |
| Conflicting RLS policies | | | | | V-003 |
| Hardcoded keys in scripts | | C2, H2 | | | |
| Partial key logging | | M1, H1 | | | |
| Missing server-only guards | | M3 | | | |

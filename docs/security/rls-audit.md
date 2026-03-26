# RLS Security Audit Report -- todoconstructor

**Project:** todoconstructor (Supabase Project ID: oojczqgarhyxcrrxjsiy)
**Audit Date:** 2026-03-25
**Source:** Migration files in `supabase/migrations/` and remote schema dump `20250711160355_remote_schema.sql`
**Auditor:** RLS Coverage Checker (automated)

---

## Executive Summary

This audit found **critical security gaps** across the todoconstructor Supabase database. The most severe issues are:

1. **21 tables with RLS enabled but policies that grant unrestricted public access** (anonymous users can read/write/delete business data)
2. **Several tables missing RLS entirely**, exposing all data through the Supabase REST API
3. **Conflicting and redundant policies** on key tables that effectively nullify role-based restrictions
4. **Storage buckets with overly permissive policies** allowing any authenticated user to modify files
5. **Role check functions referencing non-existent columns**, causing policies to silently fail

**Overall Risk Level: CRITICAL**

---

## 1. Table Inventory and RLS Status

### Tables WITH `ENABLE ROW LEVEL SECURITY`

| Table | RLS Enabled | Has Policies | Effective Protection |
|-------|:-----------:|:------------:|:--------------------:|
| CashRegister | Yes | Yes | NONE -- `USING (true)` on all ops |
| CashRegisterType | Yes | Yes | NONE -- `USING (true)` on all ops |
| CashSession | Yes | Yes | Partial -- delete restricted to admins |
| Category | Yes | Yes | NONE -- overlapping permissive policies |
| Client | Yes | Yes | NONE -- `FOR ALL TO public USING (true)` |
| ClientContact | Yes | Yes | NONE -- `FOR ALL TO public USING (true)` |
| ClientTag | Yes | Yes | NONE -- `FOR ALL TO public USING (true)` |
| ClientTagAssignment | Yes | Yes | NONE -- `FOR ALL TO public USING (true)` |
| Cost_Center | Yes | Yes | NONE -- no policies found in migrations |
| Country | Yes | Yes | NONE -- `FOR ALL TO public USING (true)` |
| EconomicSector | Yes | Yes | NONE -- `FOR ALL TO public USING (true)` |
| InventoryMovement | Yes | Yes | Minimal -- authenticated-only CRUD |
| modular_reservations | Yes | Yes | NONE -- `FOR ALL TO public USING (true)` |
| POSConfig | Yes | Yes | Unknown -- no policies in migration files |
| POSProduct | Yes | Yes | NONE -- `USING (true)` on all ops |
| POSProductCategory | Yes | Yes | NONE -- `USING (true)` on all ops |
| POSSale | Yes | Yes | Unknown -- no policies in migration files |
| POSSaleItem | Yes | Yes | Unknown -- no policies in migration files |
| POSTable | Yes | Yes | Partial -- select for authenticated, all for service_role |
| PettyCashExpense | Yes | Yes | Partial -- delete restricted to admins |
| PettyCashIncome | Yes | Yes | Partial -- delete restricted to admins |
| PettyCashPurchase | Yes | Yes | Partial -- delete restricted to admins |
| Product | Yes | Yes | NONE -- `FOR ALL TO authenticated USING (true)` |
| RelationshipType | Yes | Yes | NONE -- `FOR ALL TO public USING (true)` |
| Role | Yes | Yes | Minimal -- read-only for authenticated |
| Supplier | Yes | Yes | CONFLICTING -- role-based + unrestricted overlap |
| SupplierContact | Yes | Yes | NONE -- `FOR ALL TO authenticated USING (true)` |
| User | Yes | Yes | Partial -- own-profile restrictions exist |
| Warehouse | Yes | Yes | NONE -- multiple overlapping permissive policies |
| Warehouse_Product | Yes | Yes | NONE -- overlapping permissive policies |
| product_components | Yes | Yes | Minimal -- authenticated check on role |
| product_package_linkage | Yes | Yes | NONE -- `FOR ALL TO anon USING (true)` |
| product_sales_tracking | Yes | Yes | Partial -- role-based + permissive overlap |
| reservation_payments | Yes | Yes | NONE -- `FOR ALL TO authenticated USING (true)` |
| sales_tracking | Yes | Yes | Partial -- delete/update restricted |
| season_configurations | Yes | Yes | Minimal -- authenticated only |
| website_images | Yes | Yes | Good -- role-based (SUPER_USER, ADMIN, JEFE_SECCION) |
| pdf_training_corrections | Yes | Yes | Partial -- own-user + broken admin check |
| pdf_extraction_patterns | Yes | Yes | Partial -- broken admin role check |
| prompt_performance_log | Yes | Yes | Partial -- own-user restriction |
| supplier_templates | Yes | Yes | Partial -- broken admin role check |
| email_analysis | Yes | Yes | Minimal -- authenticated CRUD |

### Tables WITHOUT `ENABLE ROW LEVEL SECURITY`

These tables are **completely unprotected** -- any user (including anonymous) with the anon key can read and modify all data:

| Table | Data Sensitivity | Risk |
|-------|-----------------|------|
| **SupplierPayment** | HIGH -- payment amounts, bank references, bank accounts | CRITICAL |
| **SupplierTag** | LOW -- tag metadata | MEDIUM |
| **SupplierTagAssignment** | LOW -- tag assignments | MEDIUM |
| **age_pricing_modular** | LOW -- pricing multipliers | LOW |
| **companies** | MEDIUM -- company names, RUT, credit limits | HIGH |
| **company_contacts** | MEDIUM -- contact emails, spending limits | HIGH |
| **invoice_lines** | HIGH -- invoice line items, prices | CRITICAL |
| **invoice_payments** | HIGH -- payment amounts, methods | CRITICAL |
| **invoices** | HIGH -- invoice totals, client references | CRITICAL |
| **package_products_modular** | LOW -- package configuration | LOW |
| **packages_modular** | LOW -- package configuration | LOW |
| **payments** | HIGH -- payment amounts, methods | CRITICAL |
| **products_modular** | LOW -- product configuration | LOW |
| **reservation_comments** | MEDIUM -- guest comments | MEDIUM |
| **reservation_products** | MEDIUM -- reservation details | MEDIUM |
| **reservations** | HIGH -- guest names, emails, phones, billing RUT, amounts | CRITICAL |
| **rooms** | LOW -- room configuration | LOW |
| **sales_quote_lines** | MEDIUM -- quote pricing | MEDIUM |
| **sales_quotes** | MEDIUM -- quote totals, client refs | MEDIUM |
| **spa_products** | LOW -- product catalog | LOW |
| **ai_token_usage** | LOW -- AI usage tracking | LOW |
| **purchase_invoices** | HIGH -- supplier invoices, amounts | CRITICAL |
| **purchase_invoice_lines** | HIGH -- invoice line details | CRITICAL |
| **budget_emails** | MEDIUM -- email content | MEDIUM |
| **email_client_association** | MEDIUM -- email-client links | MEDIUM |
| **sent_emails** | MEDIUM -- sent email tracking | MEDIUM |

**NOTE:** Tables without RLS that also have `grant ... to "anon"` in the remote schema are fully accessible to unauthenticated API requests via the Supabase anon key. This is confirmed in the remote schema: virtually every table has `grant select/insert/update/delete to "anon"`.

---

## 2. Critical Vulnerabilities

### V-001: Anonymous Access to Financial Data [CRITICAL]

**Affected tables:** `reservations`, `payments`, `invoices`, `invoice_lines`, `invoice_payments`, `SupplierPayment`, `purchase_invoices`

**Issue:** These tables have no RLS enabled, and the remote schema grants full CRUD permissions to the `anon` role. Any person with the Supabase project URL and anon key (which is exposed in the frontend) can:
- Read all guest reservations including names, emails, phone numbers, billing RUT
- Read and modify all payment records
- Read and modify all invoices
- Read supplier payment details including bank account numbers

**Remediation:**
```sql
-- For each unprotected table:
ALTER TABLE "reservations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read" ON "reservations" FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_write" ON "reservations" FOR ALL TO authenticated
  USING (get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'))
  WITH CHECK (get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'));
```

### V-002: Policies Using `TO public USING (true)` Effectively Disable RLS [CRITICAL]

**Affected tables:** Client, ClientContact, ClientTag, ClientTagAssignment, Country, EconomicSector, RelationshipType, modular_reservations, reservation_comments, reservation_products, rooms, spa_products, companies, company_contacts, packages_modular, package_products_modular, products_modular, payments

**Issue:** These tables have RLS enabled, but their policies use `TO public USING (true)` which means the `anon` role passes the check. Since `public` includes both `anon` and `authenticated`, and `USING (true)` always evaluates to true, RLS is effectively disabled.

Example from remote schema:
```sql
create policy "Enable all for service role"
on "public"."Client"
as permissive
for all
to public
using (true);
```

Despite the policy name saying "service role", the `TO public` clause makes this apply to ALL roles including anonymous.

**Remediation:** Change `TO public` to `TO authenticated` or more specific roles, and add meaningful conditions.

### V-003: Conflicting Policies on Supplier Table Nullify Role Restrictions [HIGH]

**Issue:** The Supplier table has both restrictive role-based policies AND unrestricted permissive policies:

```sql
-- Restrictive (intended):
"Allow delete suppliers for admin only" -- checks get_user_role()
"Allow insert suppliers for admin and jefe" -- checks get_user_role()

-- Unrestricted (override everything):
"Authenticated users can do everything on Supplier" -- FOR ALL USING (true)
"supplier_delete_all" -- TO public USING (auth.uid() IS NOT NULL)
"supplier_insert_all" -- TO public WITH CHECK (auth.uid() IS NOT NULL)
"supplier_read_all" -- TO public USING (true)  <-- even anon can read
"supplier_update_all" -- TO public USING (auth.uid() IS NOT NULL)
```

Since Supabase RLS policies are combined with OR logic (permissive policies), the `supplier_read_all TO public USING (true)` policy allows anonymous read access, and the `Authenticated users can do everything` policy allows any authenticated user full CRUD regardless of role.

**Remediation:** Remove all overly permissive policies, keep only the role-based ones.

### V-004: Broken Admin Role Checks in AI Training Tables [MEDIUM]

**Affected tables:** pdf_training_corrections, pdf_extraction_patterns, supplier_templates

**Issue:** The admin policies reference `u.role` which does not exist as a column on the `"User"` table. The actual column structure uses `"roleId"` (FK to `"Role"` table) with `"roleName"` in the Role table. This means the admin-level FOR ALL policy will never match, and admins cannot manage these tables:

```sql
-- Broken: "User" table has no "role" column
CREATE POLICY "Admin users can view all corrections" ON pdf_training_corrections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')  -- WRONG COLUMN AND VALUES
        )
    );
```

The correct role names used in the system are: `SUPER_USER`, `ADMINISTRADOR`, `JEFE_SECCION`, `USUARIO_FINAL`.

**Remediation:**
```sql
CREATE POLICY "Admin users can manage all corrections" ON pdf_training_corrections
    FOR ALL USING (
        get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR')
    );
```

### V-005: Email Analysis Delete Policy References Non-existent Column [MEDIUM]

**Affected:** `EmailAnalysis` table (migration `20250116000002_fix_email_analysis_rls.sql`)

**Issue:**
```sql
CREATE POLICY "email_analysis_delete_policy" ON "EmailAnalysis"
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM User
        WHERE User.id = auth.uid()
        AND (User.roleId = 1 OR User.role = 'ADMINISTRADOR')  -- User.role does not exist
    )
);
```

The `User.role` column does not exist. The policy partially works via `User.roleId = 1` but the second condition always fails.

### V-006: User Table Allows Self-Role Modification [HIGH]

**Issue:** The User table update policy only checks `id = auth.uid()`:

```sql
create policy "Enable update for own profile"
on "public"."User"
for update to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));
```

This allows a user to modify their own `roleId` field, effectively escalating their privileges to any role (SUPER_USER, ADMINISTRADOR, etc.). All role-based policies that use `get_user_role()` would then grant elevated access.

**Remediation:** Restrict which columns can be updated, or add a check that prevents `roleId` changes:
```sql
CREATE POLICY "Users can update own profile (no role change)"
ON "public"."User"
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid()
    AND "roleId" = (SELECT "roleId" FROM "User" WHERE id = auth.uid())
);
```

### V-007: Excessive Grants to `anon` Role [HIGH]

**Issue:** The remote schema grants full CRUD including `truncate` and `trigger` permissions to the `anon` role on virtually every table. While RLS policies should restrict access, for tables without RLS or with `TO public USING (true)` policies, these grants directly expose data.

Example pattern repeated for every table:
```sql
grant delete on table "public"."CashRegister" to "anon";
grant insert on table "public"."CashRegister" to "anon";
grant select on table "public"."CashRegister" to "anon";
grant truncate on table "public"."CashRegister" to "anon";
grant update on table "public"."CashRegister" to "anon";
```

**Remediation:** Revoke unnecessary grants from anon:
```sql
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON specific_public_tables TO anon; -- only where needed
```

### V-008: Storage Bucket Policies Too Permissive [MEDIUM]

**Affected buckets:** `client-images`, `website-images`

**Issue for client-images:**
- Any authenticated user can upload, update, or delete client images
- No path-based restrictions (user A can delete user B's uploaded images)
- Public read access (intentional for client photos, but no path restriction)

**Issue for website-images:**
- Migration `20250115000020` allows any authenticated user to insert/update/delete
- Migration `20250115000022` adds role-based restrictions but uses a different `get_user_role(UUID)` function that reads from `auth.users.raw_user_meta_data` instead of the `User/Role` tables
- Migration `20250115000021` adds yet another set of policies using the `get_user_role()` (no params) that reads from User/Role tables
- Multiple conflicting policies likely exist on `storage.objects`, and the most permissive one wins

**Remediation:** Consolidate storage policies, use path-based restrictions:
```sql
CREATE POLICY "client_images_authenticated_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'client-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'clients'
);
```

---

## 3. Tables with No RLS Policies Found

The following tables have RLS enabled in the remote schema but no CREATE POLICY statements were found in any migration file:

| Table | Notes |
|-------|-------|
| Cost_Center | RLS enabled at line 274 but no policies defined |
| POSConfig | RLS enabled at line 331 but no policies found |
| POSSale | RLS enabled at line 391 but no policies found |
| POSSaleItem | RLS enabled at line 406 but no policies found |

**Impact:** With RLS enabled but no policies, these tables are completely inaccessible to all roles except `service_role` (which bypasses RLS). This means the application likely relies on service_role key for these tables, which is correct if the key is only used server-side but problematic if exposed to the client.

---

## 4. Role System Analysis

The project uses a custom role system via `"User"` and `"Role"` tables:
- `"User"."id"` links to `auth.users.id`
- `"User"."roleId"` FK to `"Role"."id"`
- `"Role"."roleName"` contains: `SUPER_USER`, `ADMINISTRADOR`, `JEFE_SECCION`, `USUARIO_FINAL`

The `get_user_role()` function (SECURITY DEFINER) correctly queries this:
```sql
SELECT r."roleName" FROM "User" u JOIN "Role" r ON u."roleId" = r."id"
WHERE u."id" = auth.uid() AND u."isActive" = true;
```

**Inconsistency found:** Some policies check roles via:
1. `get_user_role()` function -- correct approach (website_images, Supplier)
2. Direct `User/Role` JOIN in EXISTS -- correct but verbose (PettyCash*, CashSession, product_sales_tracking)
3. `auth.users.raw_user_meta_data->>'role'` -- different source, may be out of sync (sales_tracking)
4. `u.role IN ('admin', 'super_admin')` -- non-existent column with wrong role names (AI training tables)

This inconsistency means the same user may have different access levels depending on which check method a policy uses.

---

## 5. Supabase Best Practices Violations

### 5.1 Policies should target specific roles, not `public`
Per Supabase documentation, policies targeting `TO public` apply to both `anon` and `authenticated`. Most tables in this project incorrectly use `TO public` when they should use `TO authenticated`.

### 5.2 Enable RLS on all tables in the `public` schema
At least 20+ tables lack RLS entirely. Supabase strongly recommends enabling RLS on every table in the public schema, even if you want open access (use `USING (true)` with `TO authenticated` explicitly).

### 5.3 Avoid SECURITY DEFINER functions that bypass RLS for admin operations
The `generate_sale_number`, `create_email_analysis`, `cleanup_orphaned_client_images` and other functions use SECURITY DEFINER which runs with the function owner's privileges, bypassing RLS. This is acceptable for specific system operations but should be audited for potential abuse.

### 5.4 Do not grant unnecessary permissions to `anon`
The `anon` role should only have SELECT on truly public data. Currently it has full CRUD + truncate on all tables.

---

## 6. Remediation Priority

### Immediate (P0 -- do today)
1. **Enable RLS on all unprotected tables** especially: `reservations`, `payments`, `invoices`, `invoice_lines`, `invoice_payments`, `SupplierPayment`, `purchase_invoices`, `companies`, `company_contacts`
2. **Fix User table policy** to prevent roleId self-modification (V-006)
3. **Revoke anon grants** on tables that should not be publicly accessible

### High Priority (P1 -- this week)
4. **Remove overly permissive `TO public USING (true)` policies** on Client, ClientContact, ClientTag, modular_reservations, reservation_comments, reservation_products, rooms, spa_products
5. **Resolve conflicting Supplier policies** -- remove the permissive overrides
6. **Fix broken role column references** in AI training table policies

### Medium Priority (P2 -- this sprint)
7. **Consolidate storage bucket policies** to remove conflicts
8. **Standardize role checking** -- use `get_user_role()` function consistently across all policies
9. **Add policies for Cost_Center, POSConfig, POSSale, POSSaleItem** tables
10. **Audit SECURITY DEFINER functions** for potential abuse paths

### Low Priority (P3 -- backlog)
11. **Implement column-level security** for sensitive fields (bank accounts, RUT, etc.)
12. **Add audit logging** for policy changes
13. **Remove redundant duplicate policies** (e.g., multiple service_role policies on same table)

---

## 7. Summary Statistics

| Metric | Count |
|--------|------:|
| Total public tables identified | ~55 |
| Tables with RLS enabled | ~42 |
| Tables WITHOUT RLS | ~13+ |
| Tables with effective protection | ~5 |
| Tables with `TO public USING (true)` | ~21 |
| Policies with broken role checks | 4 |
| Storage buckets audited | 2 |
| Critical vulnerabilities | 3 (V-001, V-002, V-003) |
| High vulnerabilities | 3 (V-006, V-007, V-003) |
| Medium vulnerabilities | 3 (V-004, V-005, V-008) |

---

## Appendix A: Complete Policy Listing from Remote Schema

The following policies were extracted from `20250711160355_remote_schema.sql` (lines 5748-6785). This represents the actual state deployed to Supabase at the time of the schema dump.

**CashSession:** delete=admin-only, insert/select/update=authenticated(true)
**Category:** 6 overlapping policies including `FOR ALL TO authenticated USING(true)` and `FOR ALL TO service_role`
**Client:** `FOR ALL TO public USING(true)`
**ClientContact:** `FOR ALL TO public USING(true)`
**ClientTag:** `FOR ALL TO public USING(true)`
**ClientTagAssignment:** `FOR ALL TO public USING(true)`
**Country:** `FOR ALL TO public USING(true)`
**EconomicSector:** `FOR ALL TO public USING(true)`
**InventoryMovement:** CRUD for authenticated(true)
**POSTable:** select=authenticated, all=service_role
**PettyCashExpense:** delete=admin-only, insert/select/update=authenticated(true)
**PettyCashIncome:** delete=admin-only, insert/select/update=authenticated(true)
**PettyCashPurchase:** delete=admin-only, insert/select/update=authenticated(true)
**Product:** `FOR ALL TO authenticated USING(true)`, `FOR ALL TO service_role`
**RelationshipType:** `FOR ALL TO public USING(true)`
**Role:** select=authenticated
**Supplier:** Mixed role-based + `FOR ALL TO authenticated USING(true)` + `TO public` policies
**SupplierContact:** CRUD for authenticated(true)
**User:** own-profile insert/select/update, service_role for all, read for authenticated
**Warehouse:** Multiple `FOR ALL TO authenticated USING(true)`
**Warehouse_Product:** Multiple overlapping permissive policies
**age_pricing_modular:** `FOR ALL TO public USING(true)`
**companies:** `FOR ALL TO public USING(true)`
**company_contacts:** `FOR ALL TO public USING(true)`
**modular_reservations:** `FOR ALL TO public USING(true)`
**package_products_modular:** `FOR ALL TO public USING(true)`
**packages_modular:** `FOR ALL TO public USING(true)`
**payments:** `FOR ALL TO public USING(true)`
**product_components:** authenticated-role check
**product_package_linkage:** `FOR ALL TO anon USING(true)` + authenticated overlaps
**product_sales_tracking:** Role-based + permissive overlaps
**products_modular:** `FOR ALL TO public USING(true)`
**reservation_comments:** `FOR ALL TO public USING(true)`
**reservation_payments:** `FOR ALL TO authenticated USING(true)`
**reservation_products:** `FOR ALL TO public USING(true)`
**reservations:** `FOR ALL TO public USING(true)`
**rooms:** `FOR ALL TO public USING(true)`
**sales_tracking:** insert/select=public(true), delete/update=admin via auth.users metadata
**season_configurations:** authenticated only
**spa_products:** `FOR ALL TO public USING(true)`

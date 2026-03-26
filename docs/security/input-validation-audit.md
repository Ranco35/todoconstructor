# Input Validation Audit — todoconstructor

**Date:** 2026-03-25
**Auditor:** input-validation-checker agent
**Scope:** `src/actions/` and `src/app/api/`

---

## Summary

| Metric | Count |
|--------|-------|
| Endpoints / actions accepting input | 47 |
| Properly validated | 12 |
| Partially validated | 22 |
| Missing validation | 13 |

---

## Missing Validation

### 1. `src/app/api/clients/route.ts` — POST (lines 19–35)
- **Input source:** Request body (`req.json()`)
- **Fields accepted:** Entire body echoed back with no validation whatsoever
- **Risk:** Prototype pollution, data corruption. The handler destructures nothing and returns `body` directly. This endpoint appears to be a stub — if ever wired to a real database operation it would be a critical injection point.

### 2. `src/app/api/ai/chat/route.ts` — POST (lines 3–21)
- **Input source:** Request body (`request.json()`)
- **Fields accepted:** Entire body (`body`) — unused but parsed
- **Risk:** No validation. Body is read and discarded. If this placeholder is activated, there is no schema gate. Any field injection would pass through.

### 3. `src/app/api/ai/analyze/route.ts` — POST (lines 3–23)
- **Input source:** Request body (`request.json()`)
- **Fields accepted:** Full `body` object reflected back in `data.input`
- **Risk:** Information disclosure — user input is echoed directly back in the response. No sanitisation or field restriction.

### 4. `src/app/api/purchases/payments/create/route.ts` — POST
- **Input source:** Request body (`request.json()`)
- **Fields accepted:** `invoice_id`, `amount`, `payment_method`, `payment_date`, `reference_number`, `notes`, `bank_account_id`, `processed_by`
- **Risk:** `payment_date`, `reference_number`, `notes`, and `processed_by` are passed directly to the action with no format, length, or type validation. A malicious `payment_date` or unbounded `notes` string can reach the database.

### 5. `src/app/api/purchases/payments/create/route.ts` — action `createPurchasePayment` (`src/actions/purchases/payments/create.ts` lines 15–89)
- **Input source:** Action input object (forwarded unmodified from body)
- **Fields accepted:** `purchase_invoice_id`, `amount`, `payment_method`, `payment_date`, `reference`, `notes`, `processed_by`
- **Risk:** No validation inside the action itself — no check on amount > 0, no format check on payment_date, no max-length on notes/reference. All fields inserted directly into `purchase_invoice_payments`.

### 6. `src/app/api/sales/budgets/create/route.ts` — POST (lines 4–19)
- **Input source:** Request body
- **Fields accepted:** `CreateBudgetInput` (all fields)
- **Risk:** The route only checks `typeof body !== 'object'`. TypeScript type assertion `const input: CreateBudgetInput = body` gives zero runtime protection. Field-level validation (number, string format, range) is delegated to `createBudget()` which only checks presence of a few required fields — numeric ranges, string lengths, and the `lines` array item structure are never validated.

### 7. `src/app/api/sales/invoices/create/route.ts` — POST
- **Input source:** Request body
- **Fields accepted:** `CreateInvoiceInput`
- **Risk:** Same pattern as budgets — `const input: CreateInvoiceInput = body` is a TypeScript-only check. `number`, `unit_price`, `quantity`, `discount_percent`, and `taxes` fields in line items are inserted into the database with only presence checks, no numeric range or format validation.

### 8. `src/app/api/clients/import/route.ts` — POST (JSON path, lines 15–23)
- **Input source:** Request body (`request.json()`)
- **Fields accepted:** `clients` — an arbitrary array of objects
- **Risk:** Each element of the array is passed directly to `importClients()` with no schema validation of individual client fields. An attacker can craft objects with unexpected properties that flow into Supabase upsert operations.

### 9. `src/app/api/clients/apply-updates/route.ts` — POST
- **Input source:** Request body — `updates` array
- **Fields accepted:** Each element of `updates` is an arbitrary object passed directly to `applyConfirmedClientUpdates()`
- **Risk:** Only array-presence is checked. No validation of the shape or content of individual update objects before they reach DB write operations.

### 10. `src/app/api/clients/apply-email-unifications/route.ts` — POST
- **Input source:** Request body — `unifications` array
- **Fields accepted:** Each unification object, passed unchecked to `applyEmailUnifications()`
- **Risk:** Same as above — no per-item schema validation.

### 11. `src/app/api/inventory/physical/count/route.ts` — POST (lines 6–13)
- **Input source:** Request body (`request.json()`)
- **Fields accepted:** `warehouseId`, `categoryId`
- **Risk:** Both values are used directly in `.eq()` queries with no type coercion or numeric validation. A non-numeric `warehouseId` such as a string with special characters could produce unexpected query behaviour.

### 12. `src/app/api/odoo/sync/route.ts` — POST (lines 32–66)
- **Input source:** Request body
- **Fields accepted:** `includeImages` (boolean), `force` (boolean)
- **Risk:** No auth check on this endpoint. Any unauthenticated caller can trigger a full Odoo product synchronisation. No validation that `includeImages` is actually a boolean.

### 13. `src/app/api/check-env/route.ts` — GET
- **Input source:** No user input
- **Risk:** No authentication check. This endpoint exposes which secret environment variables are configured (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.). Although it only returns boolean presence flags, confirming which keys exist is useful reconnaissance for an attacker.

---

## Partial Validation

### 14. `src/actions/sales/budgets/create.ts`
Validates presence of `number`, `client_id`, `total`, `lines`. Missing: no numeric range check on `total`, no validation of individual line fields (`quantity`, `unit_price`, `discount_percent`). The `status` field accepts any string without an allowlist check.

### 15. `src/actions/sales/invoices/create.ts`
Validates presence and non-empty description per line. Missing: no numeric validation of `quantity`, `unit_price`, `discount_percent`, `subtotal`. The `status` field accepts any string.

### 16. `src/actions/clients/create.ts`
Good uniqueness checks for RUT and email. Missing: no email format validation (format is checked via `.trim().toLowerCase()` but not regex/library validated), no max-length on free-text fields like `comentarios`, `giro`, `profesion`. The `tipoCliente` field is checked by string comparison but not against an allowlist.

### 17. `src/actions/clients/update.ts`
Same as create — good field filtering via `allowedFields` array (a positive pattern). Missing: email format, string length limits, `tipoCliente` allowlist.

### 18. `src/actions/suppliers/create.ts`
Uses custom validator functions (`validateSupplierName`, `validateVAT`, `validateEmail`, `validatePhone`, `validateCreditLimit`) — a good pattern. Missing: no validation on `website` (URL format), `logo`, `image` URL fields, `notes` and `publicNotes` free text length, and `timezone` value against a known list. `tagIds` is parsed with `JSON.parse()` with no error boundary and no validation that each element is a number.

### 19. `src/actions/purchases/invoices/create.ts`
Validates supplier_id, warehouse_id, lines presence, and duplicate invoice number. Missing: no validation on `quantity` (could be 0 or negative), `unit_price` (could be negative), `discount_percent` (could exceed 100), `due_date` format.

### 20. `src/actions/purchases/payments/bulk-create.ts`
Validates invoice existence in DB and payment amount against invoice total. Missing: no validation that `invoice_ids` elements are integers (they could be strings or floats), no validation on `payment_method` against an allowlist, no max-length on `reference` and `notes`.

### 21. `src/app/api/sales/payments/create/route.ts`
Validates presence and positive amount. Missing: no validation on `payment_method` against an allowlist, no format check on `payment_date` (ISO 8601), no max-length on `reference_number`, `notes`.

### 22. `src/actions/reservations/create.ts`
Auth check present. Validates required fields for guest and dates. Missing: no email format check on `guest_email`, no phone format check on `guest_phone`, no validation on `billing_rut` format (Chilean RUT), `discount_type` compared by string but not validated against an allowlist before being written to DB, `selected_products` parsed via `JSON.parse()` without per-item validation.

### 23. `src/actions/reservations/update.ts`
Same concerns as create. Additionally, `checkoutReservation()` accepts `id: number` with no validation that it is a positive integer.

### 24. `src/app/api/clients/search/route.ts` — GET
Accepts `term` query parameter, sets minimum length = 1. The term is used in an `.ilike.%${normalizedTerm}%` pattern — Supabase parameterises this correctly, but there is no maximum length limit. An unbounded search term could cause performance issues.

### 25. `src/app/api/clients/by-rut/route.ts` — GET
Accepts `rut` query param with only a presence check. No format validation of the Chilean RUT structure before querying the database.

### 26. `src/app/api/inventory/physical/import/route.ts` — POST
Auth check present. Validates file and warehouseId presence. Missing: no file type validation (only checks `!file`, not that it is an `.xlsx`/`.xls` file), no file size limit enforced at the API layer.

### 27. `src/app/api/purchases/process-pdf/route.ts` — POST
No auth check at the route layer (auth check exists inside the action `processPDFInvoice`). No file type validation (`file.name` is logged but not checked to end in `.pdf`), no file size limit at the API layer.

### 28. `src/app/api/emails/analyze/route.ts` — GET/POST
Token verification logic is present but explicitly non-blocking (the comment says "No bloquear — permitir ejecución manual"). The `force` boolean accepted in POST is not validated as an actual boolean.

### 29. `src/app/api/backup/download/[id]/route.ts` — GET
Auth + admin-role check present. Route param `id` is used directly in `.eq('id', params.id)` without being parsed as an integer. A non-numeric or specially crafted `id` is passed raw to the query.

### 30. `src/app/api/debug/reservation/[id]/route.ts` — GET
Route param validated via `parseInt()` + `isNaN()` check. No auth or access control — any user (or unauthenticated caller) can query raw reservation data plus full client data via this debug endpoint.

### 31. `src/app/api/debug/search-clients/route.ts` — GET
No auth check. Accepts `term` query param with no validation. Returns debug output including environment variable presence flags (Supabase URL prefix).

### 32. `src/app/api/pos/sales/[id]/route.ts` — GET
Route param validated with `parseInt()` + `isNaN()`. No auth check.

### 33. `src/app/api/suppliers/route.ts` — GET
Query params parsed with `parseInt()` for `page` and `pageSize`. No upper-bound limit on `pageSize` — a caller could request millions of rows. No auth check.

### 34. `src/app/api/products/[id]/route.ts` — GET
Route param validated via `parseInt()` + `isNaN()`. No auth check.

### 35. `src/app/api/products/edit/route.ts` — POST
Delegates entirely to `updateProduct(formData)`. The action validates ID and product name. No auth check at the API route layer (action does not check auth either).

---

## Properly Validated

### 36. `src/app/api/send-email/route.ts`
Auth check via `getCurrentUser()`. Required field presence check for `to`, `subject`, `html`.

### 37. `src/actions/clients/update.ts` — `updateClientRanking()`
Explicit numeric range check: `rankingCliente < 0 || rankingCliente > 5`.

### 38. `src/app/api/clients/[id]/route.ts` — GET
Route param parsed with `parseInt()` + `isNaN()` guard.

### 39. `src/app/api/pos/sales/[id]/route.ts` — GET
Route param validated with `parseInt()` + `isNaN()`.

### 40. `src/app/api/debug/reservation/[id]/route.ts` — GET
Route param validated with `parseInt()` + `isNaN()`.

### 41. `src/app/api/products/[id]/route.ts` — GET
Route param validated with `parseInt()` + `isNaN()`.

### 42. `src/actions/reservations/update.ts` — `addPayment()`
Validates amount > 0 and payment method presence before DB write.

### 43. `src/actions/purchases/payments/bulk-create.ts`
Cross-references invoice IDs against the database and validates total amount matches.

### 44. `src/actions/suppliers/create.ts`
Uses named validator functions for name, VAT, email, phone, credit limit.

### 45. `src/actions/purchases/invoices/create.ts`
Validates required fields and checks for duplicate invoice numbers before insert.

### 46. `src/app/api/purchases/payments/bulk-create/route.ts`
API-layer checks: invoice_ids is array with length, amount > 0, payment_method present, reference non-empty.

### 47. `src/app/api/inventory/physical/import/route.ts`
Auth check, file and warehouseId presence check.

---

## Key Patterns and Observations

### No Zod usage found in API routes or server actions
Despite Zod being present in the project (found in `src/lib/invoice-extraction.schema.ts` for OpenAI response parsing, and in some utility files), **zero API routes and zero server actions use Zod for input validation**. All validation is done via manual `if` checks, which are incomplete and inconsistent across the codebase.

### Authentication gaps
The following mutation endpoints have no authentication check at the route or action layer:
- `POST /api/clients/route.ts` (stub, but callable)
- `POST /api/sales/budgets/create`
- `POST /api/sales/invoices/create`
- `POST /api/purchases/payments/create`
- `POST /api/odoo/sync`
- `POST /api/products/edit`

### Debug endpoints exposed without auth
- `GET /api/debug/reservation/[id]` — exposes full reservation + client data
- `GET /api/debug/search-clients` — exposes client search + environment info
- `GET /api/check-env` — exposes which secret keys are configured

### TypeScript types used as validation (anti-pattern)
Multiple routes cast `body` to a TypeScript interface (e.g. `const input: CreateBudgetInput = body`) and treat that as sufficient validation. TypeScript types are erased at runtime and provide no protection against malformed payloads.

### File upload endpoints missing MIME type and size validation
- `POST /api/purchases/process-pdf` — no file type or size check at route
- `POST /api/clients/import` — no file type check on Excel upload
- `POST /api/inventory/physical/import` — no file type check on Excel upload

---

## Recommended Remediation

1. **Adopt Zod across all mutation routes.** Create schemas co-located with the route files. Use `.safeParse()` and return a 400 with the full error list on failure.

2. **Add authentication middleware** to all API routes except intentionally public ones. Consider a `withAuth()` higher-order route handler.

3. **Remove or protect debug endpoints.** Add admin-role checks to `/api/debug/*`, `/api/check-env`, and `/api/debug-pos`. Preferably delete or gate them behind `NODE_ENV === 'development'`.

4. **Validate file uploads.** Check `file.type` against an allowlist (`application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) and enforce a maximum file size before processing.

5. **Add numeric range validation** for financial fields: `quantity > 0`, `unit_price >= 0`, `discount_percent` between 0 and 100, `amount > 0`.

6. **Add string length limits** on free-text fields (`notes`, `reference`, `comentarios`) to prevent unbounded data storage.

7. **Validate enum-like string fields** against allowlists: `status`, `payment_method`, `discount_type`, `tipoCliente`, `client_type`.

8. **Add a `pageSize` upper bound** (e.g. 200) to list endpoints that accept pagination parameters.

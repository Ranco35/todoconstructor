# Dependency Security Audit -- todoconstructor

**Date:** 2026-03-25
**Project:** todoconstructor (Next.js 15 / React 18)
**Auditor:** dependency-security-checker (automated)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 3 |
| Medium | 4 |
| Low / Informational | 4 |

---

## Critical Findings

### C1. `xlsx` v0.18.5 -- Known security advisory (prototype pollution)

**Package:** `xlsx` (SheetJS Community Edition)
**Installed version:** 0.18.5
**Issue:** SheetJS CE (the npm `xlsx` package) has been deprecated by its author in favor of the commercial SheetJS Pro version. The community edition at v0.18.5 has known prototype pollution vulnerabilities and is no longer receiving security patches. Multiple CVEs have been published against versions <= 0.18.5.
**Impact:** An attacker could craft a malicious spreadsheet that triggers prototype pollution when parsed, potentially leading to remote code execution or data exfiltration in the server context.
**Recommendation:** Replace `xlsx` with `exceljs` (already installed in this project) or use the paid SheetJS Pro if the full feature set is needed. Remove `xlsx` from dependencies entirely.

### C2. `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` -- Service role key exposed to the client

**File:** `src/actions/products/update-sku-admin.ts` (line 19)
**Issue:** The variable `process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` uses the `NEXT_PUBLIC_` prefix, which means Next.js will bundle it into client-side JavaScript. The Supabase service role key bypasses all Row Level Security and grants full database access.
**Impact:** If the environment variable is set with this name, the service role key will be leaked to every browser that loads the application, giving any user unrestricted database access.
**Recommendation:** Rename the variable to `SUPABASE_SERVICE_ROLE_KEY` (without the `NEXT_PUBLIC_` prefix) so it remains server-only. Verify that this env var name is not set in Vercel or `.env` files. Audit the server action in `update-sku-admin.ts` to use the correct server-side variable.

---

## High Severity Findings

### H1. Multiple unprotected debug/test API routes in production

**Routes found:**
- `/api/test` -- Exposes database schema and table counts
- `/api/check-env` -- Reveals which environment variables are configured
- `/api/debug/check-kunstmann`
- `/api/debug/search-clients`
- `/api/debug/suppliers`
- `/api/debug/reservation/[id]`
- `/api/debug-pos-sync`
- `/api/debug-pos`
- `/api/products/debug` and `/api/products/debug/[id]`
- `/api/emails/debug-analyze`
- `/api/whatsapp/debug`
- `/api/whatsapp/test-message`

**Issue:** These endpoints appear to have no authentication checks and expose internal system information (table names, record counts, environment variable presence, supplier data, client data). They are deployed to production on Vercel.
**Impact:** Information disclosure. An attacker can enumerate the database schema, check which services are configured, and potentially access business data.
**Recommendation:** Remove all debug/test routes before deploying to production, or protect them behind admin authentication. Consider moving test utilities to the `src/disabled/` folder.

### H2. `imap` v0.8.19 -- Unmaintained package

**Package:** `imap`
**Installed version:** 0.8.19
**Issue:** The `imap` package has not been updated since 2014. It relies on outdated TLS defaults and has no active maintainer to address security issues.
**Impact:** Email parsing via IMAP may be vulnerable to man-in-the-middle attacks or protocol-level exploits due to outdated TLS handling.
**Recommendation:** Replace with `imapflow` which is actively maintained and supports modern TLS.

### H3. `html2canvas` v1.4.1 -- Unmaintained, known issues

**Package:** `html2canvas`
**Installed version:** 1.4.1
**Issue:** The `html2canvas` package has known XSS vectors when rendering untrusted HTML content. The package has minimal maintenance.
**Impact:** If used to render user-supplied content, cross-site scripting is possible.
**Recommendation:** Use `html2canvas` only on trusted/sanitized content. Consider alternatives like `modern-screenshot` or `html-to-image`.

---

## Medium Severity Findings

### M1. `pdf-parse` v1.1.1 -- No updates since 2021

**Package:** `pdf-parse`
**Installed version:** 1.1.1
**Issue:** Last published in 2021 with no maintenance. Known to execute arbitrary JavaScript embedded in PDF files via its test infrastructure.
**Impact:** Potential code execution when parsing malicious PDFs.
**Recommendation:** Replace with `unpdf` or use `pdfjs-dist` (already installed) directly for PDF text extraction.

### M2. `puppeteer` v24.12.1 -- Large attack surface in production

**Package:** `puppeteer`
**Installed version:** 24.12.1
**Issue:** Puppeteer downloads a full Chromium binary and exposes a powerful browser automation API. In a serverless environment (Vercel), this dependency is unusually heavy and may not function correctly. If any route allows user-controlled URLs to be loaded via Puppeteer, it enables Server-Side Request Forgery (SSRF).
**Impact:** SSRF, local file access via `file://` protocol, and increased deployment size.
**Recommendation:** If Puppeteer is needed for PDF generation, consider lighter alternatives like `@playwright/test` with a minimal browser, or cloud-based rendering APIs. Ensure no user input reaches Puppeteer's `goto()` or `setContent()` without strict validation.

### M3. `whatsapp-web.js` v1.31.0 -- Unofficial API wrapper

**Package:** `whatsapp-web.js`
**Installed version:** 1.31.0
**Issue:** This package automates WhatsApp Web via Puppeteer and is against WhatsApp's Terms of Service. It stores session authentication data locally (`.wwebjs_auth/` directory, which is gitignored). The package pulls in a full Chromium browser and has a large dependency tree.
**Impact:** Account bans from WhatsApp, session hijacking if auth data is compromised, and large attack surface.
**Recommendation:** Migrate to the official WhatsApp Business API or WhatsApp Cloud API for production use.

### M4. `qrcode-terminal` v0.12.0 -- Development utility in production dependencies

**Package:** `qrcode-terminal`
**Installed version:** 0.12.0
**Issue:** This is a terminal-only utility for displaying QR codes in the console. It should not be a production dependency. Last updated in 2018.
**Impact:** Low direct risk, but unnecessary code in production increases attack surface.
**Recommendation:** Move to `devDependencies` or remove if unused.

---

## Low / Informational Findings

### L1. `@types/*` packages in production dependencies

**Packages:** `@types/bcryptjs`, `@types/imap`, `@types/jsonwebtoken`, `@types/multer`, `@types/nodemailer`, `@types/xlsx`
**Issue:** TypeScript type definition packages are only needed at build time, not at runtime. They should be in `devDependencies`.
**Recommendation:** Move all `@types/*` packages to `devDependencies`.

### L2. `dotenv` in production dependencies

**Package:** `dotenv` v16.6.1
**Issue:** Next.js has built-in `.env` file support. The `dotenv` package is redundant and adds unnecessary code.
**Recommendation:** Remove `dotenv` and rely on Next.js built-in environment variable loading.

### L3. No CODEOWNERS file

**Issue:** No `CODEOWNERS` file was found in the repository root, `.github/`, or `docs/` directories.
**Impact:** No automatic review assignment for pull requests. Security-sensitive files can be modified without mandatory review from designated owners.
**Recommendation:** Create a `.github/CODEOWNERS` file to enforce code review on sensitive paths such as `src/lib/supabase*`, `src/middleware.ts`, `src/app/api/**`, and `package.json`.

### L4. Lock file is present but not referenced in `.gitignore`

**Status:** GOOD. `package-lock.json` exists (lockfileVersion 3) and is not gitignored, which is the correct configuration for reproducible builds.

---

## Repository Security Configuration

| Check | Status |
|-------|--------|
| Lock file exists | Yes (package-lock.json, lockfileVersion 3) |
| Lock file committed (not gitignored) | Yes |
| `.env*` files gitignored | Yes |
| `.pem` files gitignored | Yes |
| `node_modules/` gitignored | Yes |
| CODEOWNERS file | Missing |
| WhatsApp session data gitignored | Yes (`.wwebjs_auth/`) |

---

## Dependency Overview

| Category | Count |
|----------|-------|
| Production dependencies | 43 |
| Development dependencies | 12 |
| `@types/*` in production (should be devDeps) | 6 |

**Notable large dependencies in production:**
- `puppeteer` (downloads ~300MB Chromium)
- `whatsapp-web.js` (depends on Puppeteer internally)
- `pdfjs-dist` (large PDF rendering engine)

---

## Recommended Actions (Priority Order)

1. **IMMEDIATE:** Remove or rename `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` usage in `update-sku-admin.ts`. Audit Vercel environment variables to confirm this name is not set.
2. **IMMEDIATE:** Replace `xlsx` with `exceljs` (already installed) and remove `xlsx` from `package.json`.
3. **URGENT:** Remove or protect all `/api/debug/*`, `/api/test`, and `/api/check-env` routes before next production deployment.
4. **HIGH:** Replace `imap` with `imapflow` for maintained IMAP support.
5. **HIGH:** Replace `pdf-parse` with direct `pdfjs-dist` usage or `unpdf`.
6. **MEDIUM:** Evaluate whether `puppeteer` and `whatsapp-web.js` are actively used; if so, ensure SSRF protections are in place.
7. **LOW:** Move `@types/*` packages and `dotenv` to `devDependencies`.
8. **LOW:** Create `.github/CODEOWNERS` file.
9. **LOW:** Run `npm audit` manually to capture the full CVE report from the npm registry (this automated check could not execute `npm audit` due to environment restrictions).

---

*Note: This audit could not execute `npm audit` directly. The findings above are based on static analysis of `package.json`, `package-lock.json`, source code references, and known vulnerability databases as of 2026-03-25. Running `npm audit` is strongly recommended to capture the complete list of transitive dependency vulnerabilities.*

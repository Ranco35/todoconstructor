-- Fix Supabase database linter security issues
-- 1. Fix SECURITY DEFINER view: v_client_open_debt
-- 2. Enable RLS on all public tables missing it

-- ============================================================
-- 1. Fix SECURITY DEFINER view
-- Replace SECURITY DEFINER with SECURITY INVOKER so that
-- the view respects the querying user's permissions and RLS.
-- ============================================================
ALTER VIEW public.v_client_open_debt SET (security_invoker = on);

-- ============================================================
-- 2. Enable RLS on all public tables that are missing it
-- After enabling RLS, tables with no policies will deny all
-- access by default (except to the table owner / service role).
-- We add permissive policies for authenticated users so
-- existing application functionality is preserved.
-- ============================================================

-- POS tables
ALTER TABLE public."POSSaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."POSTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."POSConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."POSProductCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."POSProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."POSSale" ENABLE ROW LEVEL SECURITY;

-- Core business tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Warehouse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Warehouse_Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_package_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_ar_debt ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Create RLS policies for authenticated users
-- These policies allow authenticated users full access,
-- preserving current application behavior while protecting
-- against anonymous/public API access.
-- ============================================================

-- Helper: macro-like pattern for each table
-- Policy: authenticated users can SELECT, INSERT, UPDATE, DELETE

-- POSSaleItem
CREATE POLICY "Authenticated users full access" ON public."POSSaleItem"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- POSTable
CREATE POLICY "Authenticated users full access" ON public."POSTable"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- POSConfig
CREATE POLICY "Authenticated users full access" ON public."POSConfig"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- POSProductCategory
CREATE POLICY "Authenticated users full access" ON public."POSProductCategory"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- POSProduct
CREATE POLICY "Authenticated users full access" ON public."POSProduct"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- POSSale
CREATE POLICY "Authenticated users full access" ON public."POSSale"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- companies
CREATE POLICY "Authenticated users full access" ON public.companies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- company_contacts
CREATE POLICY "Authenticated users full access" ON public.company_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Role
CREATE POLICY "Authenticated users full access" ON public."Role"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User
CREATE POLICY "Authenticated users full access" ON public."User"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- rooms
CREATE POLICY "Authenticated users full access" ON public.rooms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- reservations
CREATE POLICY "Authenticated users full access" ON public.reservations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- reservation_products
CREATE POLICY "Authenticated users full access" ON public.reservation_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- reservation_comments
CREATE POLICY "Authenticated users full access" ON public.reservation_comments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- spa_products
CREATE POLICY "Authenticated users full access" ON public.spa_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- payments
CREATE POLICY "Authenticated users full access" ON public.payments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Warehouse
CREATE POLICY "Authenticated users full access" ON public."Warehouse"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Warehouse_Product
CREATE POLICY "Authenticated users full access" ON public."Warehouse_Product"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product
CREATE POLICY "Authenticated users full access" ON public."Product"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- package_balance_transactions
CREATE POLICY "Authenticated users full access" ON public.package_balance_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- client_package_balance
CREATE POLICY "Authenticated users full access" ON public.client_package_balance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- client_ar_debt
CREATE POLICY "Authenticated users full access" ON public.client_ar_debt
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

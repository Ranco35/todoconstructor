-- =====================================================
-- CONFIGURAR RLS PARA INVOICES Y INVOICE_LINES
-- =====================================================
-- Ejecuta este SQL en Supabase Studio > SQL Editor
-- =====================================================

-- 1. HABILITAR RLS
ALTER TABLE IF EXISTS "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "invoice_lines" ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLÍTICAS EXISTENTES (si las hay)
DROP POLICY IF EXISTS "invoices_select_policy" ON "invoices";
DROP POLICY IF EXISTS "invoices_insert_policy" ON "invoices";
DROP POLICY IF EXISTS "invoices_update_policy" ON "invoices";
DROP POLICY IF EXISTS "invoices_delete_policy" ON "invoices";

DROP POLICY IF EXISTS "invoice_lines_select_policy" ON "invoice_lines";
DROP POLICY IF EXISTS "invoice_lines_insert_policy" ON "invoice_lines";
DROP POLICY IF EXISTS "invoice_lines_update_policy" ON "invoice_lines";
DROP POLICY IF EXISTS "invoice_lines_delete_policy" ON "invoice_lines";

-- 3. CREAR POLÍTICAS PARA INVOICES
-- Permitir a usuarios autenticados hacer todo
CREATE POLICY "invoices_select_policy" ON "invoices"
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "invoices_insert_policy" ON "invoices"
FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "invoices_update_policy" ON "invoices"
FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "invoices_delete_policy" ON "invoices"
FOR DELETE TO authenticated, anon USING (true);

-- 4. CREAR POLÍTICAS PARA INVOICE_LINES
-- Permitir a usuarios autenticados hacer todo
CREATE POLICY "invoice_lines_select_policy" ON "invoice_lines"
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "invoice_lines_insert_policy" ON "invoice_lines"
FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "invoice_lines_update_policy" ON "invoice_lines"
FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "invoice_lines_delete_policy" ON "invoice_lines"
FOR DELETE TO authenticated, anon USING (true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que las políticas se aplicaron:

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('invoices', 'invoice_lines')
ORDER BY tablename, policyname;


-- Script simplificado para corregir políticas RLS de la tabla Supplier
-- Solo lo esencial para hacer funcionar la API

-- 1. Eliminar todas las políticas existentes problemáticas
DROP POLICY IF EXISTS "Suppliers are viewable by users based on role" ON "Supplier";
DROP POLICY IF EXISTS "Suppliers can be created by authorized users" ON "Supplier";
DROP POLICY IF EXISTS "Suppliers can be updated by authorized users" ON "Supplier";
DROP POLICY IF EXISTS "Suppliers can be deleted by authorized users" ON "Supplier";
DROP POLICY IF EXISTS "supplier_select_policy" ON "Supplier";
DROP POLICY IF EXISTS "supplier_insert_policy" ON "Supplier";
DROP POLICY IF EXISTS "supplier_update_policy" ON "Supplier";
DROP POLICY IF EXISTS "supplier_delete_policy" ON "Supplier";
DROP POLICY IF EXISTS "supplier_read_policy" ON "Supplier";

-- 2. Crear política permisiva para lectura (permite leer todo)
CREATE POLICY "supplier_read_all" ON "Supplier"
  FOR SELECT
  USING (true);

-- 3. Crear políticas para modificación (usuarios autenticados)
CREATE POLICY "supplier_insert_all" ON "Supplier"
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "supplier_update_all" ON "Supplier"
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "supplier_delete_all" ON "Supplier"
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 4. Verificar que funciona - probar consulta
SELECT 
  id,
  name,
  email,
  "supplierRank",
  active,
  "companyType"
FROM "Supplier"
ORDER BY id DESC
LIMIT 5; 
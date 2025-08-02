-- Script para corregir políticas RLS de la tabla Supplier
-- Descripción: Configurar políticas que permitan acceso completo a proveedores

-- 1. Verificar estado actual de RLS
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'Supplier';

-- 2. Mostrar políticas existentes
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  roles as "Roles",
  qual as "Qualification"
FROM pg_policies 
WHERE tablename = 'Supplier';

-- 3. Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Suppliers are viewable by users based on role" ON "Supplier";
DROP POLICY IF EXISTS "Suppliers can be created by authorized users" ON "Supplier";
DROP POLICY IF EXISTS "Suppliers can be updated by authorized users" ON "Supplier";
DROP POLICY IF EXISTS "Suppliers can be deleted by authorized users" ON "Supplier";
DROP POLICY IF EXISTS "supplier_select_policy" ON "Supplier";
DROP POLICY IF EXISTS "supplier_insert_policy" ON "Supplier";
DROP POLICY IF EXISTS "supplier_update_policy" ON "Supplier";
DROP POLICY IF EXISTS "supplier_delete_policy" ON "Supplier";

-- 4. Crear políticas permisivas para lectura
CREATE POLICY "supplier_read_policy" ON "Supplier"
  FOR SELECT
  USING (true);

-- 5. Crear políticas para modificación (solo usuarios autenticados)
CREATE POLICY "supplier_insert_policy" ON "Supplier"
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "supplier_update_policy" ON "Supplier"
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "supplier_delete_policy" ON "Supplier"
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 6. Verificar que las nuevas políticas se crearon
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  permissive as "Permissive",
  qual as "Qualification"
FROM pg_policies 
WHERE tablename = 'Supplier'
ORDER BY policyname;

-- 7. Probar consulta simple
SELECT 
  id,
  name,
  email,
  "supplierRank",
  active
FROM "Supplier"
LIMIT 5; 
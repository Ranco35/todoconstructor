-- Script para corregir políticas RLS de la tabla POSProductCategory
-- Permite acceso completo para usuarios autenticados

-- Habilitar RLS en la tabla POSProductCategory si no está habilitado
ALTER TABLE "public"."POSProductCategory" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "POSProductCategory_select_policy" ON "public"."POSProductCategory";
DROP POLICY IF EXISTS "POSProductCategory_insert_policy" ON "public"."POSProductCategory";
DROP POLICY IF EXISTS "POSProductCategory_update_policy" ON "public"."POSProductCategory";
DROP POLICY IF EXISTS "POSProductCategory_delete_policy" ON "public"."POSProductCategory";

-- Crear políticas RLS para la tabla POSProductCategory
-- Política de SELECT: Todos los usuarios autenticados pueden leer
CREATE POLICY "POSProductCategory_select_policy" 
ON "public"."POSProductCategory" 
FOR SELECT 
USING (true);

-- Política de INSERT: Todos los usuarios autenticados pueden insertar
CREATE POLICY "POSProductCategory_insert_policy" 
ON "public"."POSProductCategory" 
FOR INSERT 
WITH CHECK (true);

-- Política de UPDATE: Todos los usuarios autenticados pueden actualizar
CREATE POLICY "POSProductCategory_update_policy" 
ON "public"."POSProductCategory" 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Política de DELETE: Todos los usuarios autenticados pueden eliminar
CREATE POLICY "POSProductCategory_delete_policy" 
ON "public"."POSProductCategory" 
FOR DELETE 
USING (true);

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'POSProductCategory'; 
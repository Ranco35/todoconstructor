-- Migración para agregar políticas RLS a la tabla Supplier
-- Fecha: 2025-06-28

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow all operations on Supplier" ON "Supplier";
DROP POLICY IF EXISTS "Enable read access for all users" ON "Supplier";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "Supplier";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "Supplier";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "Supplier";

-- Crear política permisiva que permite todas las operaciones para usuarios autenticados
CREATE POLICY "Allow all operations on Supplier" 
ON "Supplier"
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Crear política adicional para service role (por si acaso)
CREATE POLICY "Enable all for service role on Supplier" 
ON "Supplier" 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON POLICY "Allow all operations on Supplier" ON "Supplier" IS 'Permite todas las operaciones CRUD en proveedores para usuarios autenticados';
COMMENT ON POLICY "Enable all for service role on Supplier" ON "Supplier" IS 'Permite todas las operaciones para el service role'; 
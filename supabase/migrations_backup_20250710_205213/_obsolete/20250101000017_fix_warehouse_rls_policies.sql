-- Migración para corregir políticas RLS de la tabla Warehouse
-- Esta migración resuelve el error: "new row violates row-level security policy for table Warehouse"

-- 1. Desactivar temporalmente RLS para configurar políticas
ALTER TABLE public."Warehouse" DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Allow all operations on Warehouse" ON public."Warehouse";
DROP POLICY IF EXISTS "Allow insert Warehouse" ON public."Warehouse";
DROP POLICY IF EXISTS "Allow read Warehouse" ON public."Warehouse";
DROP POLICY IF EXISTS "Allow update Warehouse" ON public."Warehouse";
DROP POLICY IF EXISTS "Allow delete Warehouse" ON public."Warehouse";
DROP POLICY IF EXISTS "Warehouse policy" ON public."Warehouse";
DROP POLICY IF EXISTS "Enable read access for all users" ON public."Warehouse";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public."Warehouse";
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public."Warehouse";
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public."Warehouse";

-- 3. Crear política permisiva que permite todas las operaciones para usuarios autenticados
CREATE POLICY "Allow all operations on Warehouse" 
ON public."Warehouse"
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- 4. Crear política adicional para service role (por si acaso)
CREATE POLICY "Enable all for service role on Warehouse" 
ON public."Warehouse" 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- 5. Reactivar RLS con las nuevas políticas permisivas
ALTER TABLE public."Warehouse" ENABLE ROW LEVEL SECURITY;

-- 6. Verificar que las políticas se aplicaron correctamente
-- (Esta query mostrará las políticas activas)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'Warehouse' AND schemaname = 'public';

-- 7. Mensaje de confirmación
DO $$ 
BEGIN 
    RAISE NOTICE 'Políticas RLS para tabla Warehouse configuradas exitosamente';
    RAISE NOTICE 'Ahora se pueden crear bodegas sin errores de seguridad';
END $$; 
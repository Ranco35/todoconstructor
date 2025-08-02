-- CONFIGURAR POLÍTICAS RLS PARA TABLA modular_reservations

-- 1. Verificar si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'modular_reservations';

-- 2. Habilitar RLS si no está habilitado
ALTER TABLE modular_reservations ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes siguiendo el patrón del proyecto
DROP POLICY IF EXISTS "Allow all operations on modular_reservations" ON modular_reservations;
DROP POLICY IF EXISTS "Enable all for service role on modular_reservations" ON modular_reservations;

-- 4. Crear políticas RLS siguiendo el patrón estándar del proyecto
-- Política principal para usuarios autenticados
CREATE POLICY "Allow all operations on modular_reservations" ON modular_reservations
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

-- Política adicional para service role
CREATE POLICY "Enable all for service role on modular_reservations" ON modular_reservations
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- 5. Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'modular_reservations'
ORDER BY policyname;

-- 6. Verificar permisos de la tabla
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'modular_reservations';

-- 7. Asegurar que RLS esté habilitado (siguiendo el patrón del proyecto)
ALTER TABLE modular_reservations ENABLE ROW LEVEL SECURITY;

-- 8. Comentario de documentación
COMMENT ON TABLE modular_reservations IS 'Tabla de datos modulares de reservas con políticas RLS permisivas para usuarios autenticados'; 
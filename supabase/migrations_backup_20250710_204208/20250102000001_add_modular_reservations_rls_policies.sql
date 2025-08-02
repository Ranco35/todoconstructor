-- Migración: Agregar políticas RLS para tabla modular_reservations
-- Fecha: 2025-01-02
-- Autor: Sistema de reservas modulares
-- Descripción: Configurar políticas RLS permisivas para usuarios autenticados y service role

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow all operations on modular_reservations" ON modular_reservations;
DROP POLICY IF EXISTS "Enable all for service role on modular_reservations" ON modular_reservations;

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

-- Asegurar que RLS esté habilitado
ALTER TABLE modular_reservations ENABLE ROW LEVEL SECURITY;

-- Comentario de documentación
COMMENT ON TABLE modular_reservations IS 'Tabla de datos modulares de reservas con políticas RLS permisivas para usuarios autenticados'; 
-- Agregar políticas RLS para la tabla User
-- Permitir acceso de lectura para usuarios autenticados

-- Política para permitir lectura de usuarios
CREATE POLICY "Enable read access for authenticated users" ON "User"
FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción de usuarios (solo para service role)
CREATE POLICY "Enable insert for service role" ON "User"
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Política para permitir actualización de usuarios (solo para service role)
CREATE POLICY "Enable update for service role" ON "User"
FOR UPDATE USING (auth.role() = 'service_role');

-- Política para permitir eliminación de usuarios (solo para service role)
CREATE POLICY "Enable delete for service role" ON "User"
FOR DELETE USING (auth.role() = 'service_role');

-- Comentario para documentar el cambio
COMMENT ON POLICY "Enable read access for authenticated users" ON "User" IS 'Permite a usuarios autenticados leer información de usuarios';
COMMENT ON POLICY "Enable insert for service role" ON "User" IS 'Permite al service role insertar usuarios';
COMMENT ON POLICY "Enable update for service role" ON "User" IS 'Permite al service role actualizar usuarios';
COMMENT ON POLICY "Enable delete for service role" ON "User" IS 'Permite al service role eliminar usuarios'; 
-- Permitir lectura de la tabla User para todos los usuarios (incluyendo anónimos)
-- SOLO USAR EN DESARROLLO
CREATE POLICY "Enable read access for all" ON "User"
FOR SELECT USING (true);

-- Comentario para documentar el cambio
drop policy if exists "Enable read access for all" on "User"; -- Eliminar en producción 
-- Arreglar políticas RLS para website_images
-- Usar el patrón correcto del sistema AdminTermas con función get_user_role()

-- 1. Eliminar políticas existentes incorrectas
DROP POLICY IF EXISTS "Allow public read access to website images" ON website_images;
DROP POLICY IF EXISTS "Allow admin full access to website images" ON website_images;

-- 2. Verificar que la función get_user_role() existe
-- (Si no existe, la creamos)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Obtener el rol del usuario actual usando los nombres correctos de columna
  SELECT r."roleName" 
  INTO user_role
  FROM "User" u
  JOIN "Role" r ON u."roleId" = r."id"
  WHERE u."id" = auth.uid()
  AND u."isActive" = true;
  
  -- Retornar el rol o 'USUARIO_FINAL' por defecto
  RETURN COALESCE(user_role, 'USUARIO_FINAL');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear políticas específicas por operación

-- POLÍTICA DE LECTURA: Todos los usuarios autenticados pueden leer imágenes activas
-- También permite lectura pública para el website (sin autenticación)
CREATE POLICY "Allow read website images for all" 
ON website_images
FOR SELECT 
USING (is_active = true OR auth.uid() IS NOT NULL);

-- POLÍTICA DE INSERCIÓN: Solo ADMINISTRADOR y JEFE_SECCION pueden subir imágenes
CREATE POLICY "Allow insert website images for admin and jefe" 
ON website_images
FOR INSERT 
TO authenticated
WITH CHECK (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION')
);

-- POLÍTICA DE ACTUALIZACIÓN: Solo ADMINISTRADOR y JEFE_SECCION pueden editar imágenes
CREATE POLICY "Allow update website images for admin and jefe" 
ON website_images
FOR UPDATE 
TO authenticated
USING (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION')
)
WITH CHECK (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION')
);

-- POLÍTICA DE ELIMINACIÓN: Solo ADMINISTRADOR puede borrar imágenes
CREATE POLICY "Allow delete website images for admin only" 
ON website_images
FOR DELETE 
TO authenticated
USING (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR')
);

-- 4. Mantener política para service role (para operaciones del sistema)
CREATE POLICY "Enable all for service role on website images" 
ON website_images 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- 5. Comentarios para documentación
COMMENT ON POLICY "Allow read website images for all" ON website_images IS 'Permite lectura pública de imágenes activas y total para usuarios autenticados';
COMMENT ON POLICY "Allow insert website images for admin and jefe" ON website_images IS 'Solo administradores y jefes pueden subir imágenes';
COMMENT ON POLICY "Allow update website images for admin and jefe" ON website_images IS 'Solo administradores y jefes pueden editar imágenes';
COMMENT ON POLICY "Allow delete website images for admin only" ON website_images IS 'Solo administradores pueden eliminar imágenes';
COMMENT ON POLICY "Enable all for service role on website images" ON website_images IS 'Service role tiene acceso completo para operaciones del sistema'; 
-- Migración para implementar permisos granulares basados en roles para la tabla Supplier
-- Fecha: 2025-06-28

-- 1. Crear función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT r.roleName 
  INTO user_role
  FROM "User" u
  JOIN "Role" r ON u.roleId = r.id
  WHERE u.id = auth.uid()
  AND u.isActive = true;
  
  RETURN COALESCE(user_role, 'USUARIO_FINAL');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar políticas existentes permisivas
DROP POLICY IF EXISTS "Allow all operations on Supplier" ON "Supplier";
DROP POLICY IF EXISTS "Enable all for service role on Supplier" ON "Supplier";

-- 3. Crear políticas específicas por operación

-- POLÍTICA DE LECTURA: Todos los usuarios autenticados pueden leer proveedores
CREATE POLICY "Allow read suppliers for authenticated users" 
ON "Supplier"
FOR SELECT 
TO authenticated
USING (true);

-- POLÍTICA DE INSERCIÓN: Solo ADMINISTRADOR y JEFE_SECCION pueden crear proveedores
CREATE POLICY "Allow insert suppliers for admin and jefe" 
ON "Supplier"
FOR INSERT 
TO authenticated
WITH CHECK (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION')
);

-- POLÍTICA DE ACTUALIZACIÓN: Solo ADMINISTRADOR y JEFE_SECCION pueden editar proveedores
CREATE POLICY "Allow update suppliers for admin and jefe" 
ON "Supplier"
FOR UPDATE 
TO authenticated
USING (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION')
)
WITH CHECK (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION')
);

-- POLÍTICA DE ELIMINACIÓN: Solo ADMINISTRADOR puede borrar proveedores
CREATE POLICY "Allow delete suppliers for admin only" 
ON "Supplier"
FOR DELETE 
TO authenticated
USING (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR')
);

-- 4. Mantener políticas para service role (para operaciones del sistema)
CREATE POLICY "Enable all for service role on Supplier" 
ON "Supplier" 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- 5. Comentarios para documentación
COMMENT ON FUNCTION get_user_role() IS 'Función que retorna el rol del usuario autenticado actual';
COMMENT ON POLICY "Allow read suppliers for authenticated users" ON "Supplier" IS 'Permite lectura de proveedores a todos los usuarios autenticados';
COMMENT ON POLICY "Allow insert suppliers for admin and jefe" ON "Supplier" IS 'Permite crear proveedores solo a ADMINISTRADOR y JEFE_SECCION';
COMMENT ON POLICY "Allow update suppliers for admin and jefe" ON "Supplier" IS 'Permite editar proveedores solo a ADMINISTRADOR y JEFE_SECCION';
COMMENT ON POLICY "Allow delete suppliers for admin only" ON "Supplier" IS 'Permite borrar proveedores solo a ADMINISTRADOR';
COMMENT ON POLICY "Enable all for service role on Supplier" ON "Supplier" IS 'Permite todas las operaciones para el service role'; 
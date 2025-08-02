-- Migración correctiva para la función get_user_role() con manejo de dependencias
-- Fecha: 2025-06-28
-- Descripción: Corregir la función eliminando primero las políticas dependientes

-- 1. Eliminar políticas que dependen de la función
DROP POLICY IF EXISTS "Allow insert suppliers for admin and jefe" ON "Supplier";
DROP POLICY IF EXISTS "Allow update suppliers for admin and jefe" ON "Supplier";
DROP POLICY IF EXISTS "Allow delete suppliers for admin only" ON "Supplier";

-- 2. Eliminar función existente
DROP FUNCTION IF EXISTS get_user_role();

-- 3. Recrear función con nombres de columna correctos (con comillas dobles)
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

-- 4. Recrear políticas usando la función corregida

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

-- 5. Agregar comentarios para documentación
COMMENT ON FUNCTION get_user_role() IS 'Función corregida que retorna el rol del usuario autenticado actual';
COMMENT ON POLICY "Allow insert suppliers for admin and jefe" ON "Supplier" IS 'Permite crear proveedores solo a ADMINISTRADOR y JEFE_SECCION';
COMMENT ON POLICY "Allow update suppliers for admin and jefe" ON "Supplier" IS 'Permite editar proveedores solo a ADMINISTRADOR y JEFE_SECCION';
COMMENT ON POLICY "Allow delete suppliers for admin only" ON "Supplier" IS 'Permite borrar proveedores solo a ADMINISTRADOR'; 
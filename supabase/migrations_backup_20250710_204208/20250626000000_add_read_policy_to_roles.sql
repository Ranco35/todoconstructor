-- Politica RLS para la tabla de Roles
-- Permite a los usuarios autenticados leer los roles.

CREATE POLICY "Allow authenticated users to read roles"
ON "public"."Role" FOR SELECT
TO authenticated
USING (true); 
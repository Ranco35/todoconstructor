-- Politicas RLS para la tabla de Usuarios (Perfiles)

-- 1. Permite a los usuarios leer su propio perfil.
CREATE POLICY "Allow individual users to read their own profile"
ON "public"."User" FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Permite a los usuarios insertar su propio perfil.
CREATE POLICY "Allow individual users to insert their own profile"
ON "public"."User" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id); 
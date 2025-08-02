-- Script para corregir políticas RLS de CashSession y User
-- Ejecutar este script para permitir acceso a las sesiones de caja chica

BEGIN;

-- Verificar si RLS está habilitado en CashSession
DO $$
BEGIN
    -- Agregar políticas para CashSession
    
    -- Política de SELECT para todos los usuarios autenticados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'CashSession' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON "public"."CashSession"
        AS PERMISSIVE FOR SELECT
        TO authenticated
        USING (true);
        
        RAISE NOTICE 'Created SELECT policy for CashSession';
    END IF;

    -- Política de INSERT para usuarios autenticados  
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'CashSession' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON "public"."CashSession"
        AS PERMISSIVE FOR INSERT
        TO authenticated
        WITH CHECK (true);
        
        RAISE NOTICE 'Created INSERT policy for CashSession';
    END IF;

    -- Política de UPDATE para usuarios autenticados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'CashSession' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON "public"."CashSession"
        AS PERMISSIVE FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE 'Created UPDATE policy for CashSession';
    END IF;

    -- Política de DELETE para administradores
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'CashSession' 
        AND policyname = 'Enable delete for admins'
    ) THEN
        CREATE POLICY "Enable delete for admins" ON "public"."CashSession"
        AS PERMISSIVE FOR DELETE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM "public"."User" u
                JOIN "public"."Role" r ON u."roleId" = r.id  
                WHERE u.id = auth.uid()
                AND r."roleName" IN ('SUPER_USER', 'ADMINISTRADOR')
            )
        );
        
        RAISE NOTICE 'Created DELETE policy for CashSession';
    END IF;

END
$$;

-- Verificar y agregar políticas para User
DO $$
BEGIN
    -- Política de SELECT para usuarios autenticados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'User' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON "public"."User"
        AS PERMISSIVE FOR SELECT
        TO authenticated
        USING (true);
        
        RAISE NOTICE 'Created SELECT policy for User';
    END IF;

    -- Política de INSERT para usuarios autenticados (para JIT creation)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'User' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON "public"."User"
        AS PERMISSIVE FOR INSERT
        TO authenticated
        WITH CHECK (id = auth.uid());
        
        RAISE NOTICE 'Created INSERT policy for User';
    END IF;

    -- Política de UPDATE para usuarios (solo su propio perfil)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'User' 
        AND policyname = 'Enable update for own profile'
    ) THEN
        CREATE POLICY "Enable update for own profile" ON "public"."User"
        AS PERMISSIVE FOR UPDATE
        TO authenticated
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
        
        RAISE NOTICE 'Created UPDATE policy for User';
    END IF;

END
$$;

-- Habilitar RLS en las tablas si no está habilitado
ALTER TABLE "public"."CashSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;

-- Verificar políticas creadas
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('CashSession', 'User')
ORDER BY tablename, policyname;

COMMIT;

-- Mensaje final
SELECT 'RLS policies for CashSession and User have been configured successfully!' as result;

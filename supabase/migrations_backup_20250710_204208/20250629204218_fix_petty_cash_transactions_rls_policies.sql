-- Migración para corregir políticas RLS de transacciones de caja chica
-- Agregando políticas para PettyCashExpense, PettyCashPurchase, PettyCashIncome

BEGIN;

-- ====================================
-- POLÍTICAS PARA PettyCashExpense
-- ====================================

DO $$
BEGIN
    -- Política de SELECT para gastos de caja chica
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashExpense' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON "public"."PettyCashExpense"
        AS PERMISSIVE FOR SELECT
        TO authenticated
        USING (true);
        
        RAISE NOTICE 'Created SELECT policy for PettyCashExpense';
    END IF;

    -- Política de INSERT para gastos de caja chica
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashExpense' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON "public"."PettyCashExpense"
        AS PERMISSIVE FOR INSERT
        TO authenticated
        WITH CHECK (true);
        
        RAISE NOTICE 'Created INSERT policy for PettyCashExpense';
    END IF;

    -- Política de UPDATE para gastos de caja chica
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashExpense' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON "public"."PettyCashExpense"
        AS PERMISSIVE FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE 'Created UPDATE policy for PettyCashExpense';
    END IF;

    -- Política de DELETE para administradores
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashExpense' 
        AND policyname = 'Enable delete for admins'
    ) THEN
        CREATE POLICY "Enable delete for admins" ON "public"."PettyCashExpense"
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
        
        RAISE NOTICE 'Created DELETE policy for PettyCashExpense';
    END IF;

END
$$;

-- ====================================
-- POLÍTICAS PARA PettyCashPurchase
-- ====================================

DO $$
BEGIN
    -- Política de SELECT para compras de caja chica
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashPurchase' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON "public"."PettyCashPurchase"
        AS PERMISSIVE FOR SELECT
        TO authenticated
        USING (true);
        
        RAISE NOTICE 'Created SELECT policy for PettyCashPurchase';
    END IF;

    -- Política de INSERT para compras de caja chica
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashPurchase' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON "public"."PettyCashPurchase"
        AS PERMISSIVE FOR INSERT
        TO authenticated
        WITH CHECK (true);
        
        RAISE NOTICE 'Created INSERT policy for PettyCashPurchase';
    END IF;

    -- Política de UPDATE para compras de caja chica
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashPurchase' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON "public"."PettyCashPurchase"
        AS PERMISSIVE FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE 'Created UPDATE policy for PettyCashPurchase';
    END IF;

    -- Política de DELETE para administradores
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashPurchase' 
        AND policyname = 'Enable delete for admins'
    ) THEN
        CREATE POLICY "Enable delete for admins" ON "public"."PettyCashPurchase"
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
        
        RAISE NOTICE 'Created DELETE policy for PettyCashPurchase';
    END IF;

END
$$;

-- ====================================
-- POLÍTICAS PARA PettyCashIncome
-- ====================================

DO $$
BEGIN
    -- Política de SELECT para ingresos de caja chica
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashIncome' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON "public"."PettyCashIncome"
        AS PERMISSIVE FOR SELECT
        TO authenticated
        USING (true);
        
        RAISE NOTICE 'Created SELECT policy for PettyCashIncome';
    END IF;

    -- Política de INSERT para ingresos de caja chica
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashIncome' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON "public"."PettyCashIncome"
        AS PERMISSIVE FOR INSERT
        TO authenticated
        WITH CHECK (true);
        
        RAISE NOTICE 'Created INSERT policy for PettyCashIncome';
    END IF;

    -- Política de UPDATE para ingresos de caja chica
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashIncome' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON "public"."PettyCashIncome"
        AS PERMISSIVE FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE 'Created UPDATE policy for PettyCashIncome';
    END IF;

    -- Política de DELETE para administradores
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PettyCashIncome' 
        AND policyname = 'Enable delete for admins'
    ) THEN
        CREATE POLICY "Enable delete for admins" ON "public"."PettyCashIncome"
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
        
        RAISE NOTICE 'Created DELETE policy for PettyCashIncome';
    END IF;

END
$$;

-- ====================================
-- HABILITAR RLS EN LAS TABLAS
-- ====================================

-- Habilitar RLS en las tablas de transacciones
ALTER TABLE "public"."PettyCashExpense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PettyCashPurchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PettyCashIncome" ENABLE ROW LEVEL SECURITY;

-- ====================================
-- VERIFICACIÓN DE POLÍTICAS CREADAS
-- ====================================

-- Mostrar políticas creadas para verificación
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('PettyCashExpense', 'PettyCashPurchase', 'PettyCashIncome')
ORDER BY tablename, policyname;

COMMIT;

-- Mensaje final
SELECT 'RLS policies for PettyCash transaction tables have been configured successfully!' as result;

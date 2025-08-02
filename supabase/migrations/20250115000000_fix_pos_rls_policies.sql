-- Migration: Fix POS RLS Policies
-- Aplicar políticas RLS permisivas para todas las tablas POS

-- ============================================================================
-- 1. POSSaleItem - Políticas permisivas
-- ============================================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on POSSaleItem" ON "POSSaleItem";
DROP POLICY IF EXISTS "Enable all for service role on POSSaleItem" ON "POSSaleItem";
DROP POLICY IF EXISTS "POSSaleItem_select_policy" ON "POSSaleItem";
DROP POLICY IF EXISTS "POSSaleItem_insert_policy" ON "POSSaleItem";
DROP POLICY IF EXISTS "POSSaleItem_update_policy" ON "POSSaleItem";
DROP POLICY IF EXISTS "POSSaleItem_delete_policy" ON "POSSaleItem";

-- Crear políticas permisivas para POSSaleItem
CREATE POLICY "Allow all operations on POSSaleItem" ON "POSSaleItem"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on POSSaleItem" ON "POSSaleItem"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- ============================================================================
-- 2. POSSale - Políticas permisivas
-- ============================================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on POSSale" ON "POSSale";
DROP POLICY IF EXISTS "Enable all for service role on POSSale" ON "POSSale";

-- Crear políticas permisivas para POSSale
CREATE POLICY "Allow all operations on POSSale" ON "POSSale"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on POSSale" ON "POSSale"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- ============================================================================
-- 3. POSProduct - Políticas permisivas
-- ============================================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on POSProduct" ON "POSProduct";
DROP POLICY IF EXISTS "Enable all for service role on POSProduct" ON "POSProduct";
DROP POLICY IF EXISTS "POSProduct_select_policy" ON "POSProduct";
DROP POLICY IF EXISTS "POSProduct_insert_policy" ON "POSProduct";
DROP POLICY IF EXISTS "POSProduct_update_policy" ON "POSProduct";
DROP POLICY IF EXISTS "POSProduct_delete_policy" ON "POSProduct";

-- Crear políticas permisivas para POSProduct
CREATE POLICY "Allow all operations on POSProduct" ON "POSProduct"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on POSProduct" ON "POSProduct"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- ============================================================================
-- 4. POSProductCategory - Políticas permisivas
-- ============================================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on POSProductCategory" ON "POSProductCategory";
DROP POLICY IF EXISTS "Enable all for service role on POSProductCategory" ON "POSProductCategory";
DROP POLICY IF EXISTS "POSProductCategory_select_policy" ON "POSProductCategory";
DROP POLICY IF EXISTS "POSProductCategory_insert_policy" ON "POSProductCategory";
DROP POLICY IF EXISTS "POSProductCategory_update_policy" ON "POSProductCategory";
DROP POLICY IF EXISTS "POSProductCategory_delete_policy" ON "POSProductCategory";

-- Crear políticas permisivas para POSProductCategory
CREATE POLICY "Allow all operations on POSProductCategory" ON "POSProductCategory"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on POSProductCategory" ON "POSProductCategory"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- ============================================================================
-- 5. POSConfig - Políticas permisivas
-- ============================================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on POSConfig" ON "POSConfig";
DROP POLICY IF EXISTS "Enable all for service role on POSConfig" ON "POSConfig";

-- Crear políticas permisivas para POSConfig
CREATE POLICY "Allow all operations on POSConfig" ON "POSConfig"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on POSConfig" ON "POSConfig"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- ============================================================================
-- 6. CashRegisterType - Políticas permisivas
-- ============================================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on CashRegisterType" ON "CashRegisterType";
DROP POLICY IF EXISTS "Enable all for service role on CashRegisterType" ON "CashRegisterType";
DROP POLICY IF EXISTS "CashRegisterType_select_policy" ON "CashRegisterType";
DROP POLICY IF EXISTS "CashRegisterType_insert_policy" ON "CashRegisterType";
DROP POLICY IF EXISTS "CashRegisterType_update_policy" ON "CashRegisterType";
DROP POLICY IF EXISTS "CashRegisterType_delete_policy" ON "CashRegisterType";

-- Crear políticas permisivas para CashRegisterType
CREATE POLICY "Allow all operations on CashRegisterType" ON "CashRegisterType"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on CashRegisterType" ON "CashRegisterType"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- ============================================================================
-- 7. CashRegister - Políticas permisivas
-- ============================================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on CashRegister" ON "CashRegister";
DROP POLICY IF EXISTS "Enable all for service role on CashRegister" ON "CashRegister";
DROP POLICY IF EXISTS "CashRegister_select_policy" ON "CashRegister";
DROP POLICY IF EXISTS "CashRegister_insert_policy" ON "CashRegister";
DROP POLICY IF EXISTS "CashRegister_update_policy" ON "CashRegister";
DROP POLICY IF EXISTS "CashRegister_delete_policy" ON "CashRegister";

-- Crear políticas permisivas para CashRegister
CREATE POLICY "Allow all operations on CashRegister" ON "CashRegister"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on CashRegister" ON "CashRegister"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- ============================================================================
-- 8. POSTable - Políticas permisivas
-- ============================================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on POSTable" ON "POSTable";
DROP POLICY IF EXISTS "Enable all for service role on POSTable" ON "POSTable";

-- Crear políticas permisivas para POSTable
CREATE POLICY "Allow all operations on POSTable" ON "POSTable"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on POSTable" ON "POSTable"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- ============================================================================
-- 9. CashSession - Políticas permisivas (si no existen)
-- ============================================================================
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on CashSession" ON "CashSession";
DROP POLICY IF EXISTS "Enable all for service role on CashSession" ON "CashSession";

-- Crear políticas permisivas para CashSession
CREATE POLICY "Allow all operations on CashSession" ON "CashSession"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on CashSession" ON "CashSession"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true); 
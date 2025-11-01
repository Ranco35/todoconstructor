-- ============================================
-- 2. VERIFICAR NOMBRES Y NUMERACIÓN
-- ============================================

-- Ver nombres actuales
SELECT 
    "id",
    "name" as nombre_interno,
    "displayName" as nombre_mostrado,
    "isActive" as activo
FROM "CashRegisterType"
ORDER BY "id";

-- Probar numeración
SELECT 
    "id" as tipo_id,
    "displayName" as pos,
    generate_sale_number("id") as proximo_numero
FROM "CashRegisterType"
ORDER BY "id";


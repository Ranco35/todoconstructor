-- ============================================
-- VER ESTADO REAL DE CADA POS
-- ============================================

-- Ferretería (ID 1)
SELECT 
    'FERRETERÍA (ID 1) - Categorías:' as info,
    COUNT(*) as total
FROM "POSProductCategory"
WHERE "cashRegisterTypeId" = 1 AND "isActive" = true;

SELECT 
    "id",
    "displayName" as categoria,
    "icon"
FROM "POSProductCategory"
WHERE "cashRegisterTypeId" = 1 AND "isActive" = true
ORDER BY "sortOrder", "displayName"
LIMIT 10;

-- Ferreteria2 (ID 2)
SELECT 
    'FERRETERIA2 (ID 2) - Categorías:' as info,
    COUNT(*) as total
FROM "POSProductCategory"
WHERE "cashRegisterTypeId" = 2 AND "isActive" = true;

SELECT 
    "id",
    "displayName" as categoria,
    "icon"
FROM "POSProductCategory"
WHERE "cashRegisterTypeId" = 2 AND "isActive" = true
ORDER BY "sortOrder", "displayName";

-- Productos por POS
SELECT 
    'PRODUCTOS POR POS:' as info;

SELECT 
    CASE 
        WHEN c."cashRegisterTypeId" = 1 THEN 'Ferretería'
        WHEN c."cashRegisterTypeId" = 2 THEN 'Ferreteria2'
    END as pos,
    COUNT(DISTINCT p."id") as total_productos
FROM "POSProductCategory" c
LEFT JOIN "POSProduct" p ON p."categoryId" = c."id" AND p."isActive" = true
WHERE c."isActive" = true
GROUP BY c."cashRegisterTypeId";


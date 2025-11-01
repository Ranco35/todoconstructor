-- ============================================
-- DUPLICAR CATEGORÍAS DE FERRETERÍA A FERRETERIA2
-- Y VINCULAR LOS MISMOS PRODUCTOS
-- ============================================

-- PASO 1: Duplicar categorías de Ferretería (ID 1) a Ferreteria2 (ID 2)
INSERT INTO "POSProductCategory" (
    "name",
    "displayName",
    "icon",
    "color",
    "cashRegisterTypeId",
    "sortOrder",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT 
    "name",
    "displayName",
    "icon",
    "color",
    2 as "cashRegisterTypeId",  -- Ferreteria2
    "sortOrder",
    "isActive",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "POSProductCategory"
WHERE "cashRegisterTypeId" = 1  -- Copiar desde Ferretería
  AND "isActive" = true
  AND NOT EXISTS (
    -- Evitar duplicados: solo insertar si no existe ya
    SELECT 1 FROM "POSProductCategory" pc2
    WHERE pc2."name" = "POSProductCategory"."name"
      AND pc2."cashRegisterTypeId" = 2
  );

-- PASO 2: Vincular los mismos productos a las nuevas categorías de Ferreteria2
INSERT INTO "POSProduct" (
    "name",
    "description",
    "sku",
    "price",
    "cost",
    "image",
    "categoryId",
    "productId",
    "isActive",
    "stockRequired",
    "sortOrder",
    "createdAt",
    "updatedAt"
)
SELECT 
    pp."name",
    pp."description",
    pp."sku" || '-FER2' as "sku",  -- SKU único para Ferreteria2
    pp."price",
    pp."cost",
    pp."image",
    -- Obtener el ID de la categoría correspondiente en Ferreteria2
    (
        SELECT pc2."id" 
        FROM "POSProductCategory" pc2 
        WHERE pc2."name" = pc1."name" 
          AND pc2."cashRegisterTypeId" = 2
        LIMIT 1
    ) as "categoryId",
    pp."productId",
    pp."isActive",
    pp."stockRequired",
    pp."sortOrder",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "POSProduct" pp
INNER JOIN "POSProductCategory" pc1 ON pp."categoryId" = pc1."id"
WHERE pc1."cashRegisterTypeId" = 1  -- Productos de Ferretería
  AND pp."isActive" = true
  AND NOT EXISTS (
    -- Evitar duplicados: solo si el producto no existe en Ferreteria2
    SELECT 1 FROM "POSProduct" pp2
    INNER JOIN "POSProductCategory" pc2 ON pp2."categoryId" = pc2."id"
    WHERE pp2."productId" = pp."productId"
      AND pc2."cashRegisterTypeId" = 2
  )
  AND EXISTS (
    -- Solo si existe la categoría destino en Ferreteria2
    SELECT 1 FROM "POSProductCategory" pc2
    WHERE pc2."name" = pc1."name"
      AND pc2."cashRegisterTypeId" = 2
  );

-- PASO 3: Verificar resultado
SELECT '✅ DUPLICACIÓN COMPLETADA - Verificación:' as resultado;

-- Categorías por POS
SELECT 
    CASE 
        WHEN "cashRegisterTypeId" = 1 THEN 'Ferretería (ID 1)'
        WHEN "cashRegisterTypeId" = 2 THEN 'Ferreteria2 (ID 2)'
    END as pos,
    COUNT(*) as total_categorias
FROM "POSProductCategory"
WHERE "isActive" = true
GROUP BY "cashRegisterTypeId"
ORDER BY "cashRegisterTypeId";

-- Productos por POS
SELECT 
    CASE 
        WHEN c."cashRegisterTypeId" = 1 THEN 'Ferretería (ID 1)'
        WHEN c."cashRegisterTypeId" = 2 THEN 'Ferreteria2 (ID 2)'
    END as pos,
    COUNT(DISTINCT p."id") as total_productos
FROM "POSProductCategory" c
LEFT JOIN "POSProduct" p ON p."categoryId" = c."id" AND p."isActive" = true
WHERE c."isActive" = true
GROUP BY c."cashRegisterTypeId"
ORDER BY c."cashRegisterTypeId";

-- Resultado esperado:
-- Ferretería (ID 1): 21 categorías, 581 productos
-- Ferreteria2 (ID 2): 21 categorías, 581 productos


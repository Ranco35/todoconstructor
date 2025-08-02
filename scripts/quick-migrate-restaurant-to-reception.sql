-- ===================================================================
-- MIGRACIÓN RÁPIDA: Restaurante → Recepción
-- ===================================================================
-- Copia productos que están solo en Restaurante también a Recepción
-- ===================================================================

-- Insertar productos de restaurante también en recepción
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
    "sortOrder"
)
SELECT DISTINCT 
    pp."name",
    pp."description",
    pp."sku", 
    pp."price",
    pp."cost",
    pp."image",
    (
        -- Obtener primera categoría activa de recepción
        SELECT id 
        FROM "POSProductCategory" 
        WHERE "isActive" = true 
          AND "cashRegisterTypeId" = 1  -- Recepción
        ORDER BY "sortOrder" 
        LIMIT 1
    ) as "categoryId",
    pp."productId",
    true as "isActive",
    pp."stockRequired",
    pp."sortOrder"
FROM "POSProduct" pp
JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
WHERE pp."isActive" = true 
  AND pp."productId" IS NOT NULL
  AND pc."cashRegisterTypeId" = 2  -- Solo productos de restaurante
  AND pp."productId" NOT IN (
    -- Excluir productos que YA están en recepción
    SELECT DISTINCT pp2."productId"
    FROM "POSProduct" pp2
    JOIN "POSProductCategory" pc2 ON pp2."categoryId" = pc2.id
    WHERE pp2."isActive" = true 
      AND pp2."productId" IS NOT NULL
      AND pc2."cashRegisterTypeId" = 1  -- Productos de recepción
  )
  AND EXISTS (
    -- Solo ejecutar si existe al menos una categoría de recepción
    SELECT 1 
    FROM "POSProductCategory" 
    WHERE "isActive" = true 
      AND "cashRegisterTypeId" = 1
  );

-- Mostrar resultado
SELECT 
    COUNT(*) as productos_migrados,
    'Productos copiados de Restaurante a Recepción' as descripcion
FROM "POSProduct" pp
JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
WHERE pp."isActive" = true 
  AND pp."productId" IS NOT NULL
  AND pc."cashRegisterTypeId" = 1;  -- Productos ahora en recepción 
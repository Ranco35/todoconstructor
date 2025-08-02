-- ===================================================================
-- VERIFICACIÓN: Distribución de Productos POS
-- ===================================================================
-- Script para verificar cómo están distribuidos los productos
-- entre Restaurante y Recepción antes/después de la migración
-- ===================================================================

-- 1. RESUMEN GENERAL
SELECT 
    '📊 RESUMEN GENERAL' as seccion,
    COUNT(*) as total_productos_pos,
    COUNT(DISTINCT "productId") as productos_unicos
FROM "POSProduct" 
WHERE "isActive" = true AND "productId" IS NOT NULL;

-- 2. DISTRIBUCIÓN POR TIPO DE POS
SELECT 
    '🏪 DISTRIBUCIÓN POR TIPO DE POS' as seccion,
    CASE 
        WHEN pc."cashRegisterTypeId" = 1 THEN '🏨 Recepción'
        WHEN pc."cashRegisterTypeId" = 2 THEN '🍽️ Restaurante'
        ELSE '❓ Otro'
    END as tipo_pos,
    COUNT(*) as cantidad_productos,
    COUNT(DISTINCT pp."productId") as productos_unicos
FROM "POSProduct" pp
JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
WHERE pp."isActive" = true AND pp."productId" IS NOT NULL
GROUP BY pc."cashRegisterTypeId"
ORDER BY pc."cashRegisterTypeId";

-- 3. CATEGORÍAS DISPONIBLES POR TIPO
SELECT 
    '📁 CATEGORÍAS DISPONIBLES' as seccion,
    CASE 
        WHEN "cashRegisterTypeId" = 1 THEN '🏨 Recepción'
        WHEN "cashRegisterTypeId" = 2 THEN '🍽️ Restaurante'
        ELSE '❓ Otro'
    END as tipo_pos,
    "displayName" as categoria,
    id as categoria_id,
    "isActive" as activa
FROM "POSProductCategory"
ORDER BY "cashRegisterTypeId", "sortOrder";

-- 4. PRODUCTOS SOLO EN RESTAURANTE
SELECT 
    '🔍 PRODUCTOS SOLO EN RESTAURANTE' as seccion,
    COUNT(*) as cantidad,
    'Productos que necesitan migrar a Recepción' as descripcion
FROM "POSProduct" pp
JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
WHERE pp."isActive" = true 
  AND pp."productId" IS NOT NULL
  AND pc."cashRegisterTypeId" = 2  -- Solo productos de restaurante
  AND pp."productId" NOT IN (
    SELECT DISTINCT pp2."productId"
    FROM "POSProduct" pp2
    JOIN "POSProductCategory" pc2 ON pp2."categoryId" = pc2.id
    WHERE pp2."isActive" = true 
      AND pp2."productId" IS NOT NULL
      AND pc2."cashRegisterTypeId" = 1  -- Productos de recepción
  );

-- 5. PRODUCTOS SOLO EN RECEPCIÓN
SELECT 
    '🔍 PRODUCTOS SOLO EN RECEPCIÓN' as seccion,
    COUNT(*) as cantidad,
    'Productos que están únicamente en Recepción' as descripcion
FROM "POSProduct" pp
JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
WHERE pp."isActive" = true 
  AND pp."productId" IS NOT NULL
  AND pc."cashRegisterTypeId" = 1  -- Solo productos de recepción
  AND pp."productId" NOT IN (
    SELECT DISTINCT pp2."productId"
    FROM "POSProduct" pp2
    JOIN "POSProductCategory" pc2 ON pp2."categoryId" = pc2.id
    WHERE pp2."isActive" = true 
      AND pp2."productId" IS NOT NULL
      AND pc2."cashRegisterTypeId" = 2  -- Productos de restaurante
  );

-- 6. PRODUCTOS EN AMBOS POS
SELECT 
    '✅ PRODUCTOS EN AMBOS POS' as seccion,
    COUNT(*) as cantidad,
    'Productos que aparecen tanto en Recepción como en Restaurante' as descripcion
FROM (
    SELECT "productId"
    FROM "POSProduct" pp
    JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
    WHERE pp."isActive" = true 
      AND pp."productId" IS NOT NULL
    GROUP BY "productId"
    HAVING COUNT(DISTINCT pc."cashRegisterTypeId") >= 2
) as productos_duales;

-- 7. LISTADO DETALLADO DE PRODUCTOS SOLO EN RESTAURANTE
SELECT 
    '📋 DETALLE: PRODUCTOS SOLO EN RESTAURANTE' as seccion,
    pp."productId",
    pp."name" as nombre_producto,
    pp."price" as precio,
    pc."displayName" as categoria_restaurante
FROM "POSProduct" pp
JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
WHERE pp."isActive" = true 
  AND pp."productId" IS NOT NULL
  AND pc."cashRegisterTypeId" = 2  -- Solo productos de restaurante
  AND pp."productId" NOT IN (
    SELECT DISTINCT pp2."productId"
    FROM "POSProduct" pp2
    JOIN "POSProductCategory" pc2 ON pp2."categoryId" = pc2.id
    WHERE pp2."isActive" = true 
      AND pp2."productId" IS NOT NULL
      AND pc2."cashRegisterTypeId" = 1  -- Productos de recepción
  )
ORDER BY pp."name";

-- 8. VERIFICAR ESTADO DE PRODUCTOS HABILITADOS PARA POS
SELECT 
    '🔗 PRODUCTOS HABILITADOS VS SINCRONIZADOS' as seccion,
    (SELECT COUNT(*) FROM "Product" WHERE "isPOSEnabled" = true) as productos_habilitados,
    COUNT(DISTINCT "productId") as productos_sincronizados,
    (SELECT COUNT(*) FROM "Product" WHERE "isPOSEnabled" = true) - COUNT(DISTINCT "productId") as productos_pendientes
FROM "POSProduct" 
WHERE "isActive" = true AND "productId" IS NOT NULL;

-- 9. ANÁLISIS DE EFICIENCIA DE MIGRACIÓN
SELECT 
    '📈 ANÁLISIS DE MIGRACIÓN' as seccion,
    CASE 
        WHEN productos_solo_restaurante = 0 THEN '✅ Todos los productos están en ambos POS'
        WHEN productos_solo_recepcion = 0 AND productos_duales > 0 THEN '✅ Migración completa realizada'
        WHEN productos_solo_restaurante > 0 THEN '⚠️ Hay productos que necesitan migración'
        ELSE '❓ Estado indeterminado'
    END as estado_migracion,
    productos_solo_restaurante,
    productos_solo_recepcion,
    productos_duales
FROM (
    SELECT 
        -- Productos solo en restaurante
        (SELECT COUNT(*) 
         FROM "POSProduct" pp
         JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
         WHERE pp."isActive" = true 
           AND pp."productId" IS NOT NULL
           AND pc."cashRegisterTypeId" = 2
           AND pp."productId" NOT IN (
             SELECT DISTINCT pp2."productId"
             FROM "POSProduct" pp2
             JOIN "POSProductCategory" pc2 ON pp2."categoryId" = pc2.id
             WHERE pp2."isActive" = true 
               AND pp2."productId" IS NOT NULL
               AND pc2."cashRegisterTypeId" = 1
           )
        ) as productos_solo_restaurante,
        
        -- Productos solo en recepción
        (SELECT COUNT(*) 
         FROM "POSProduct" pp
         JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
         WHERE pp."isActive" = true 
           AND pp."productId" IS NOT NULL
           AND pc."cashRegisterTypeId" = 1
           AND pp."productId" NOT IN (
             SELECT DISTINCT pp2."productId"
             FROM "POSProduct" pp2
             JOIN "POSProductCategory" pc2 ON pp2."categoryId" = pc2.id
             WHERE pp2."isActive" = true 
               AND pp2."productId" IS NOT NULL
               AND pc2."cashRegisterTypeId" = 2
           )
        ) as productos_solo_recepcion,
        
        -- Productos en ambos
        (SELECT COUNT(*) 
         FROM (
           SELECT "productId"
           FROM "POSProduct" pp
           JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
           WHERE pp."isActive" = true 
             AND pp."productId" IS NOT NULL
           GROUP BY "productId"
           HAVING COUNT(DISTINCT pc."cashRegisterTypeId") >= 2
         ) as duales
        ) as productos_duales
) as analisis; 
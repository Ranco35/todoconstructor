-- ===================================================================
-- MIGRACIÓN: Duplicar Productos de Restaurante a Recepción
-- ===================================================================
-- Propósito: Copiar productos que solo están en POS Restaurante
--           para que también aparezcan en POS Recepción
-- Fecha: Enero 2025
-- Estado: Listo para ejecutar
-- ===================================================================

BEGIN;

-- Mostrar estado inicial
SELECT 
    'ESTADO INICIAL' as fase,
    COUNT(*) as total_productos_pos
FROM "POSProduct" 
WHERE "isActive" = true AND "productId" IS NOT NULL;

-- Mostrar productos por tipo de POS (estado inicial)
SELECT 
    'DISTRIBUCIÓN INICIAL' as fase,
    CASE 
        WHEN pc."cashRegisterTypeId" = 1 THEN 'Recepción'
        WHEN pc."cashRegisterTypeId" = 2 THEN 'Restaurante'
        ELSE 'Otro'
    END as tipo_pos,
    COUNT(*) as cantidad_productos
FROM "POSProduct" pp
JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
WHERE pp."isActive" = true AND pp."productId" IS NOT NULL
GROUP BY pc."cashRegisterTypeId"
ORDER BY pc."cashRegisterTypeId";

-- ===================================================================
-- PASO 1: Identificar productos que están SOLO en Restaurante
-- ===================================================================

-- Crear tabla temporal con productos solo en restaurante
CREATE TEMP TABLE productos_solo_restaurante AS
SELECT DISTINCT 
    pp."productId",
    pp."name",
    pp."description", 
    pp."sku",
    pp."price",
    pp."cost",
    pp."image",
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
  );

-- Mostrar productos identificados para migrar
SELECT 
    'PRODUCTOS A MIGRAR' as fase,
    COUNT(*) as cantidad,
    'Productos que están solo en Restaurante y se copiarán a Recepción' as descripcion
FROM productos_solo_restaurante;

-- Listar los productos específicos
SELECT 
    'LISTA DE PRODUCTOS A MIGRAR' as fase,
    "productId",
    "name",
    "price"
FROM productos_solo_restaurante
ORDER BY "name";

-- ===================================================================
-- PASO 2: Obtener categoría por defecto de Recepción
-- ===================================================================

-- Verificar que existe categoría de recepción
SELECT 
    'CATEGORÍA RECEPCIÓN' as fase,
    id as categoria_id,
    "displayName" as nombre_categoria,
    "cashRegisterTypeId" as tipo_pos
FROM "POSProductCategory" 
WHERE "isActive" = true 
  AND "cashRegisterTypeId" = 1  -- Recepción
ORDER BY "sortOrder" 
LIMIT 1;

-- ===================================================================
-- PASO 3: Ejecutar la migración
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
SELECT 
    psr."name",
    psr."description",
    psr."sku", 
    psr."price",
    psr."cost",
    psr."image",
    (
        -- Obtener primera categoría activa de recepción
        SELECT id 
        FROM "POSProductCategory" 
        WHERE "isActive" = true 
          AND "cashRegisterTypeId" = 1  -- Recepción
        ORDER BY "sortOrder" 
        LIMIT 1
    ) as "categoryId",
    psr."productId",
    true as "isActive",
    psr."stockRequired",
    psr."sortOrder"
FROM productos_solo_restaurante psr
WHERE EXISTS (
    -- Solo ejecutar si existe al menos una categoría de recepción
    SELECT 1 
    FROM "POSProductCategory" 
    WHERE "isActive" = true 
      AND "cashRegisterTypeId" = 1
);

-- Obtener número de registros insertados
GET DIAGNOSTICS inserted_count = ROW_COUNT;

-- ===================================================================
-- PASO 4: Verificar resultados
-- ===================================================================

-- Mostrar estado final
SELECT 
    'ESTADO FINAL' as fase,
    COUNT(*) as total_productos_pos
FROM "POSProduct" 
WHERE "isActive" = true AND "productId" IS NOT NULL;

-- Mostrar nueva distribución por tipo de POS
SELECT 
    'DISTRIBUCIÓN FINAL' as fase,
    CASE 
        WHEN pc."cashRegisterTypeId" = 1 THEN 'Recepción'
        WHEN pc."cashRegisterTypeId" = 2 THEN 'Restaurante'
        ELSE 'Otro'
    END as tipo_pos,
    COUNT(*) as cantidad_productos
FROM "POSProduct" pp
JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
WHERE pp."isActive" = true AND pp."productId" IS NOT NULL
GROUP BY pc."cashRegisterTypeId"
ORDER BY pc."cashRegisterTypeId";

-- Mostrar productos únicos sincronizados
SELECT 
    'PRODUCTOS ÚNICOS SINCRONIZADOS' as fase,
    COUNT(DISTINCT "productId") as productos_unicos_total
FROM "POSProduct" 
WHERE "isActive" = true AND "productId" IS NOT NULL;

-- Verificar productos que ahora están en ambos POS
SELECT 
    'PRODUCTOS EN AMBOS POS' as fase,
    COUNT(*) as cantidad_productos_duales
FROM (
    SELECT "productId"
    FROM "POSProduct" pp
    JOIN "POSProductCategory" pc ON pp."categoryId" = pc.id
    WHERE pp."isActive" = true 
      AND pp."productId" IS NOT NULL
    GROUP BY "productId"
    HAVING COUNT(DISTINCT pc."cashRegisterTypeId") >= 2
) as productos_duales;

-- Limpiar tabla temporal
DROP TABLE productos_solo_restaurante;

-- ===================================================================
-- RESUMEN DE LA MIGRACIÓN
-- ===================================================================

SELECT 
    '🎉 MIGRACIÓN COMPLETADA' as resultado,
    'Los productos que estaban solo en Restaurante ahora también están en Recepción' as descripcion,
    'Ejecutar sincronización desde /dashboard/pos/test-dual-sync para futuras adiciones' as recomendacion;

COMMIT;

-- ===================================================================
-- NOTAS IMPORTANTES
-- ===================================================================
-- 1. Esta migración es SEGURA - no elimina ni modifica productos existentes
-- 2. Solo DUPLICA productos de restaurante a recepción
-- 3. Los productos mantienen todos sus datos (precios, nombres, etc.)
-- 4. Se asignan a la primera categoría disponible de recepción
-- 5. La migración es IDEMPOTENTE - se puede ejecutar varias veces sin problemas
-- 6. Después de esta migración, usar la nueva función syncPOSProducts() para productos futuros
-- =================================================================== 
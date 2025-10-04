-- NORMALIZACIÓN DE SKUs: Quitar sufijos de la base de datos
-- Este script actualiza los SKUs para quitar los sufijos -REC, -3986-REC, etc.

-- 1. PRIMERO: Verificar qué SKUs se van a actualizar
SELECT 
    'SKUs que se van a actualizar' as accion,
    id,
    sku as sku_actual,
    CASE 
        WHEN sku LIKE '%-3986-REC' THEN REPLACE(sku, '-3986-REC', '')
        WHEN sku LIKE '%-REC' THEN REPLACE(sku, '-REC', '')
        WHEN sku LIKE '%-3986' THEN REPLACE(sku, '-3986', '')
        ELSE sku
    END as sku_nuevo,
    name,
    "isActive"
FROM "POSProduct" 
WHERE sku LIKE '%-3986-REC'
   OR sku LIKE '%-REC'
   OR sku LIKE '%-3986'
ORDER BY sku;

-- 2. ACTUALIZAR SKUs con sufijo -3986-REC
UPDATE "POSProduct" 
SET sku = REPLACE(sku, '-3986-REC', ''),
    "updatedAt" = NOW()
WHERE sku LIKE '%-3986-REC';

-- 3. ACTUALIZAR SKUs con sufijo -REC (que no tengan -3986 antes)
UPDATE "POSProduct" 
SET sku = REPLACE(sku, '-REC', ''),
    "updatedAt" = NOW()
WHERE sku LIKE '%-REC'
  AND sku NOT LIKE '%-3986-REC';

-- 4. ACTUALIZAR SKUs con sufijo -3986 (que no tengan -REC después)
UPDATE "POSProduct" 
SET sku = REPLACE(sku, '-3986', ''),
    "updatedAt" = NOW()
WHERE sku LIKE '%-3986'
  AND sku NOT LIKE '%-3986-REC'
  AND sku NOT LIKE '%-3986-%';

-- 5. VERIFICAR que las actualizaciones fueron exitosas
SELECT 
    'VERIFICACIÓN: SKUs después de la actualización' as resultado,
    id,
    sku,
    name,
    "isActive",
    "updatedAt"
FROM "POSProduct" 
WHERE sku IN (
    'gris-87-001',
    'gris-87-002', 
    'gris-87-003',
    '05-plan-001',
    '05-plan-002',
    '50-angu-001',
    '11mm-osb-001',
    '1mm-15-001',
    '8mm-osb-001',
    '9mm-osb-001',
    '10mm-20-001',
    '6MM-2400-001-1134',
    '6mm-2400-1135'
)
ORDER BY sku;

-- 6. CONTAR productos actualizados
SELECT 
    'RESUMEN: Productos actualizados' as tipo,
    COUNT(*) as total_productos_actualizados
FROM "POSProduct" 
WHERE "updatedAt" >= NOW() - INTERVAL '1 minute';

-- 7. VERIFICAR que no hay duplicados después de la actualización
SELECT 
    'VERIFICACIÓN: SKUs duplicados (si los hay)' as tipo,
    sku,
    COUNT(*) as cantidad_duplicados,
    STRING_AGG(id::text, ', ') as ids_duplicados
FROM "POSProduct" 
WHERE sku IN (
    'gris-87-001',
    'gris-87-002', 
    'gris-87-003',
    '05-plan-001',
    '05-plan-002',
    '50-angu-001',
    '11mm-osb-001',
    '1mm-15-001',
    '8mm-osb-001',
    '9mm-osb-001',
    '10mm-20-001',
    '6MM-2400-001-1134',
    '6mm-2400-1135'
)
GROUP BY sku
HAVING COUNT(*) > 1;

-- NORMALIZACIÓN SEGURA DE SKUs: Script con backup y verificación
-- ⚠️ EJECUTAR PASO A PASO PARA VERIFICAR CADA ACTUALIZACIÓN

-- PASO 1: Crear tabla de backup (opcional pero recomendado)
CREATE TABLE IF NOT EXISTS "POSProduct_backup_skus" AS 
SELECT *, NOW() as backup_date
FROM "POSProduct" 
WHERE sku LIKE '%-3986-REC'
   OR sku LIKE '%-REC'
   OR sku LIKE '%-3986';

-- PASO 2: Ver exactamente qué se va a cambiar
SELECT 
    'PREVIEW: Cambios que se van a realizar' as accion,
    id,
    sku as sku_actual,
    CASE 
        WHEN sku LIKE '%-3986-REC' THEN REPLACE(sku, '-3986-REC', '')
        WHEN sku LIKE '%-REC' THEN REPLACE(sku, '-REC', '')
        WHEN sku LIKE '%-3986' THEN REPLACE(sku, '-3986', '')
        ELSE sku
    END as sku_nuevo,
    name
FROM "POSProduct" 
WHERE sku LIKE '%-3986-REC'
   OR sku LIKE '%-REC'
   OR sku LIKE '%-3986'
ORDER BY sku;

-- PASO 3: Actualización específica para 50-angu-001-3986-REC
-- (Este es el caso que sabemos que existe)
UPDATE "POSProduct" 
SET sku = '50-angu-001',
    "updatedAt" = NOW()
WHERE sku = '50-angu-001-3986-REC';

-- PASO 4: Verificar que el cambio fue exitoso
SELECT 
    'VERIFICACIÓN: 50-angu-001 actualizado' as resultado,
    id,
    sku,
    name,
    "isActive"
FROM "POSProduct" 
WHERE sku = '50-angu-001';

-- PASO 5: Buscar otros productos con sufijos similares
SELECT 
    'OTROS PRODUCTOS con sufijos para revisar' as tipo,
    id,
    sku,
    name,
    "isActive"
FROM "POSProduct" 
WHERE (sku LIKE '%-3986-REC'
   OR sku LIKE '%-REC'
   OR sku LIKE '%-3986')
  AND sku != '50-angu-001-3986-REC'  -- Ya actualizado
ORDER BY sku;

-- PASO 6: Si hay más productos, ejecutar actualizaciones adicionales
-- (Descomenta las líneas que necesites)

/*
-- Para productos con -3986-REC
UPDATE "POSProduct" 
SET sku = REPLACE(sku, '-3986-REC', ''),
    "updatedAt" = NOW()
WHERE sku LIKE '%-3986-REC';

-- Para productos con -REC (que no tengan -3986 antes)
UPDATE "POSProduct" 
SET sku = REPLACE(sku, '-REC', ''),
    "updatedAt" = NOW()
WHERE sku LIKE '%-REC'
  AND sku NOT LIKE '%-3986-REC';

-- Para productos con -3986 (que no tengan -REC después)
UPDATE "POSProduct" 
SET sku = REPLACE(sku, '-3986', ''),
    "updatedAt" = NOW()
WHERE sku LIKE '%-3986'
  AND sku NOT LIKE '%-3986-REC'
  AND sku NOT LIKE '%-3986-%';
*/

-- PASO 7: Verificación final de todos los SKUs problemáticos
SELECT 
    'VERIFICACIÓN FINAL: Todos los SKUs problemáticos' as resultado,
    CASE 
        WHEN id IS NOT NULL THEN '✅ ENCONTRADO'
        ELSE '❌ NO ENCONTRADO'
    END as estado,
    sku_buscado,
    p.id,
    p.sku,
    p.name,
    p."isActive"
FROM (
    VALUES 
        ('gris-87-001'),
        ('gris-87-002'), 
        ('gris-87-003'),
        ('05-plan-001'),
        ('05-plan-002'),
        ('50-angu-001'),
        ('11mm-osb-001'),
        ('1mm-15-001'),
        ('8mm-osb-001'),
        ('9mm-osb-001'),
        ('10mm-20-001'),
        ('6MM-2400-001-1134'),
        ('6mm-2400-1135')
) AS busqueda(sku_buscado)
LEFT JOIN "POSProduct" p ON p.sku = busqueda.sku_buscado
ORDER BY busqueda.sku_buscado;

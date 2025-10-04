-- Diagnóstico detallado de SKUs problemáticos

-- 1. Verificar estructura de tabla Product
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Product' 
ORDER BY ordinal_position;

-- 2. Verificar si existen los SKUs exactos
WITH skus_buscados AS (
    SELECT unnest(ARRAY[
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
    ]) as sku_buscado
)
SELECT 
    s.sku_buscado,
    CASE 
        WHEN p.id IS NOT NULL THEN 'ENCONTRADO'
        ELSE 'NO ENCONTRADO'
    END as estado,
    p.id,
    p.name,
    p."isForSale",
    p."createdAt"
FROM skus_buscados s
LEFT JOIN "Product" p ON p.sku = s.sku_buscado
ORDER BY s.sku_buscado;

-- 3. Buscar SKUs similares (con LIKE)
SELECT 
    'SKUs similares encontrados' as tipo,
    sku,
    name,
    "isForSale"
FROM "Product" 
WHERE sku LIKE '%gris%' 
   OR sku LIKE '%87%'
   OR sku LIKE '%plan%'
   OR sku LIKE '%angu%'
   OR sku LIKE '%osb%'
   OR sku LIKE '%2400%'
   OR sku LIKE '%1134%'
   OR sku LIKE '%1135%'
ORDER BY sku;

-- 4. Verificar si hay productos inactivos
SELECT 
    'Productos inactivos con SKUs similares' as tipo,
    sku,
    name,
    "isForSale",
    "createdAt"
FROM "Product" 
WHERE "isForSale" = false 
  AND (sku LIKE '%gris%' 
       OR sku LIKE '%87%'
       OR sku LIKE '%plan%'
       OR sku LIKE '%angu%'
       OR sku LIKE '%osb%'
       OR sku LIKE '%2400%'
       OR sku LIKE '%1134%'
       OR sku LIKE '%1135%')
ORDER BY sku;

-- 5. Verificar última importación o productos recientes
SELECT 
    'Productos más recientes' as tipo,
    sku,
    name,
    "isForSale",
    "createdAt"
FROM "Product" 
ORDER BY "createdAt" DESC
LIMIT 20;

-- Verificación específica en tabla POSProduct para SKUs problemáticos

-- 1. Verificar SKUs exactos en POSProduct
SELECT 
    'POSProduct - SKUs exactos' as tipo,
    id,
    sku,
    name,
    price,
    cost,
    "isActive",
    "productId",
    "createdAt"
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

-- 2. Buscar variaciones de SKU en POSProduct (mayúsculas/minúsculas)
SELECT 
    'POSProduct - Variaciones' as tipo,
    id,
    sku,
    name,
    "isActive"
FROM "POSProduct" 
WHERE LOWER(TRIM(sku)) IN (
    LOWER('gris-87-001'),
    LOWER('gris-87-002'), 
    LOWER('gris-87-003'),
    LOWER('05-plan-001'),
    LOWER('05-plan-002'),
    LOWER('50-angu-001'),
    LOWER('11mm-osb-001'),
    LOWER('1mm-15-001'),
    LOWER('8mm-osb-001'),
    LOWER('9mm-osb-001'),
    LOWER('10mm-20-001'),
    LOWER('6MM-2400-001-1134'),
    LOWER('6mm-2400-1135')
)
ORDER BY sku;

-- 3. Verificar productos inactivos en POSProduct
SELECT 
    'POSProduct - Inactivos' as tipo,
    id,
    sku,
    name,
    "isActive",
    "createdAt"
FROM "POSProduct" 
WHERE "isActive" = false 
  AND (sku LIKE '%gris%' 
       OR sku LIKE '%87%'
       OR sku LIKE '%plan%'
       OR sku LIKE '%angu%'
       OR sku LIKE '%osb%'
       OR sku LIKE '%2400%'
       OR sku LIKE '%1134%'
       OR sku LIKE '%1135%')
ORDER BY sku;

-- 4. Verificar relación con tabla Product
SELECT 
    'POSProduct con relación Product' as tipo,
    pp.id as posproduct_id,
    pp.sku as posproduct_sku,
    pp.name as posproduct_name,
    pp."productId",
    p.id as product_id,
    p.sku as product_sku,
    p.name as product_name
FROM "POSProduct" pp
LEFT JOIN "Product" p ON p.id = pp."productId"
WHERE pp.sku IN (
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
ORDER BY pp.sku;

-- 5. Contar totales
SELECT 
    'Conteo POSProduct' as tipo,
    COUNT(*) as total_productos,
    COUNT(CASE WHEN "isActive" = true THEN 1 END) as activos,
    COUNT(CASE WHEN "isActive" = false THEN 1 END) as inactivos
FROM "POSProduct";

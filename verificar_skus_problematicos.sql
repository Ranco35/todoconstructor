-- Verificar SKUs problemáticos en diferentes tablas
-- Consulta para verificar si los SKUs existen en la tabla Product

SELECT 
    'Product' as tabla,
    id,
    sku,
    name,
    "isForSale",
    "createdAt"
FROM "Product" 
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

-- Verificar en POSProduct (tabla principal del POS)
SELECT 
    'POSProduct' as tabla,
    id,
    sku,
    name,
    "isActive",
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

-- Buscar variaciones de SKU (con espacios, mayúsculas/minúsculas, etc.)
SELECT 
    'Product_variaciones' as tabla,
    id,
    sku,
    name,
    "isForSale"
FROM "Product" 
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

-- Contar total de productos por tabla
SELECT 
    'Product' as tabla,
    COUNT(*) as total_productos
FROM "Product"
UNION ALL
SELECT 
    'POSProduct' as tabla,
    COUNT(*) as total_productos
FROM "POSProduct";

-- Ver algunos SKUs similares en Product para comparar formato
SELECT 
    'Product_similares' as tipo,
    sku,
    name,
    "isForSale"
FROM "Product" 
WHERE sku LIKE '%gris%' 
   OR sku LIKE '%plan%'
   OR sku LIKE '%angu%'
   OR sku LIKE '%osb%'
   OR sku LIKE '%2400%'
   OR sku LIKE '%1134%'
   OR sku LIKE '%1135%'
ORDER BY sku
LIMIT 10;

-- Ver algunos SKUs similares en POSProduct para comparar formato
SELECT 
    'POSProduct_similares' as tipo,
    sku,
    name,
    "isActive"
FROM "POSProduct" 
WHERE sku LIKE '%gris%' 
   OR sku LIKE '%plan%'
   OR sku LIKE '%angu%'
   OR sku LIKE '%osb%'
   OR sku LIKE '%2400%'
   OR sku LIKE '%1134%'
   OR sku LIKE '%1135%'
ORDER BY sku
LIMIT 10;

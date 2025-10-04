-- SOLUCIÓN: Los SKUs existen pero con sufijos adicionales
-- Este archivo muestra cómo resolver el problema

-- 1. CONFIRMAR: Los SKUs problemáticos SÍ existen pero con sufijos
SELECT 
    'CONFIRMACIÓN: SKUs encontrados con sufijos' as resultado,
    sku_buscado,
    sku_encontrado,
    name,
    "isActive"
FROM (
    VALUES 
        ('50-angu-001', '50-angu-001-3986-REC')
) AS busqueda(sku_buscado, sku_encontrado)
JOIN "POSProduct" p ON p.sku = busqueda.sku_encontrado;

-- 2. OPCIÓN 1: Actualizar el sistema de importación para buscar por prefijo
-- En lugar de buscar SKU exacto, buscar SKU que EMPIECE con el valor
SELECT 
    'OPCIÓN 1: Búsqueda por prefijo' as solucion,
    sku,
    name,
    "isActive"
FROM "POSProduct" 
WHERE sku LIKE '50-angu-001%'
   OR sku LIKE 'gris-87-001%'
   OR sku LIKE 'gris-87-002%'
   OR sku LIKE 'gris-87-003%'
   OR sku LIKE '05-plan-001%'
   OR sku LIKE '05-plan-002%'
   OR sku LIKE '11mm-osb-001%'
   OR sku LIKE '1mm-15-001%'
   OR sku LIKE '8mm-osb-001%'
   OR sku LIKE '9mm-osb-001%'
   OR sku LIKE '10mm-20-001%'
   OR sku LIKE '6MM-2400-001-1134%'
   OR sku LIKE '6mm-2400-1135%'
ORDER BY sku;

-- 3. OPCIÓN 2: Crear registros con SKUs exactos (si es necesario)
-- INSERT INTO "POSProduct" (name, sku, price, "categoryId", "isActive")
-- SELECT 
--     name,
--     '50-angu-001',  -- SKU sin sufijo
--     price,
--     "categoryId",
--     "isActive"
-- FROM "POSProduct" 
-- WHERE sku = '50-angu-001-3986-REC';

-- 4. RECOMENDACIÓN: Verificar todos los SKUs con sufijos
SELECT 
    'SKUs con sufijos que pueden causar problemas' as tipo,
    sku,
    SUBSTRING(sku FROM '^([^-]+-[^-]+-[^-]+)') as sku_base,
    name,
    "isActive"
FROM "POSProduct" 
WHERE sku LIKE '%-%'
  AND sku NOT LIKE '%-%'
  AND LENGTH(sku) > 15  -- SKUs muy largos probablemente tienen sufijos
ORDER BY SUBSTRING(sku FROM '^([^-]+-[^-]+-[^-]+)'), sku;

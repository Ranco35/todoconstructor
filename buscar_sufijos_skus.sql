-- Buscar SKUs que empiecen con los patrones problemáticos
-- Esto ayudará a identificar si los SKUs tienen sufijos adicionales

-- Buscar SKUs que empiecen con los patrones problemáticos
SELECT 
    'SKUs con prefijos encontrados' as tipo,
    sku,
    name,
    "isActive",
    "createdAt"
FROM "POSProduct" 
WHERE sku LIKE 'gris-87-001%'
   OR sku LIKE 'gris-87-002%'
   OR sku LIKE 'gris-87-003%'
   OR sku LIKE '05-plan-001%'
   OR sku LIKE '05-plan-002%'
   OR sku LIKE '50-angu-001%'
   OR sku LIKE '11mm-osb-001%'
   OR sku LIKE '1mm-15-001%'
   OR sku LIKE '8mm-osb-001%'
   OR sku LIKE '9mm-osb-001%'
   OR sku LIKE '10mm-20-001%'
   OR sku LIKE '6MM-2400-001-1134%'
   OR sku LIKE '6mm-2400-1135%'
ORDER BY sku;

-- Buscar también en tabla Product por si acaso
SELECT 
    'Product - SKUs con prefijos' as tipo,
    sku,
    name,
    "isForSale",
    "createdAt"
FROM "Product" 
WHERE sku LIKE 'gris-87-001%'
   OR sku LIKE 'gris-87-002%'
   OR sku LIKE 'gris-87-003%'
   OR sku LIKE '05-plan-001%'
   OR sku LIKE '05-plan-002%'
   OR sku LIKE '50-angu-001%'
   OR sku LIKE '11mm-osb-001%'
   OR sku LIKE '1mm-15-001%'
   OR sku LIKE '8mm-osb-001%'
   OR sku LIKE '9mm-osb-001%'
   OR sku LIKE '10mm-20-001%'
   OR sku LIKE '6MM-2400-001-1134%'
   OR sku LIKE '6mm-2400-1135%'
ORDER BY sku;

-- Verificar patrones de sufijos comunes
SELECT 
    'Análisis de sufijos' as tipo,
    CASE 
        WHEN sku LIKE '%-REC' THEN 'Sufijo -REC'
        WHEN sku LIKE '%-3986%' THEN 'Sufijo -3986'
        WHEN sku LIKE '%-REC-%' THEN 'Sufijo -REC-'
        WHEN sku LIKE '%-3986-REC' THEN 'Sufijo -3986-REC'
        ELSE 'Sin sufijo conocido'
    END as tipo_sufijo,
    COUNT(*) as cantidad,
    STRING_AGG(sku, ', ') as ejemplos
FROM "POSProduct" 
WHERE sku LIKE '%-REC%' 
   OR sku LIKE '%-3986%'
GROUP BY CASE 
    WHEN sku LIKE '%-REC' THEN 'Sufijo -REC'
    WHEN sku LIKE '%-3986%' THEN 'Sufijo -3986'
    WHEN sku LIKE '%-REC-%' THEN 'Sufijo -REC-'
    WHEN sku LIKE '%-3986-REC' THEN 'Sufijo -3986-REC'
    ELSE 'Sin sufijo conocido'
END
ORDER BY cantidad DESC;

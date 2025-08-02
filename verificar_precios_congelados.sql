-- Script para verificar que los precios congelados funcionen correctamente
-- Objetivo: Verificar que el sistema muestre precios finales congelados

-- 1. Verificar productos con precios finales congelados
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
    CASE 
        WHEN "finalPrice" IS NOT NULL THEN 'CONGELADO'
        ELSE 'NO CONGELADO'
    END as estado_precio
FROM "Product" 
WHERE "finalPrice" IS NOT NULL 
AND "finalPrice" > 0
ORDER BY "finalPrice" DESC
LIMIT 15;

-- 2. Verificar productos sin precios congelados (para comparar)
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
    CASE 
        WHEN "finalPrice" IS NOT NULL THEN 'CONGELADO'
        ELSE 'NO CONGELADO'
    END as estado_precio
FROM "Product" 
WHERE ("finalPrice" IS NULL OR "finalPrice" = 0)
AND saleprice IS NOT NULL 
AND vat IS NOT NULL
ORDER BY saleprice DESC
LIMIT 10;

-- 3. Estadísticas generales de precios congelados
SELECT 
    COUNT(*) as total_productos,
    COUNT("finalPrice") as productos_congelados,
    COUNT(*) - COUNT("finalPrice") as productos_no_congelados,
    ROUND((COUNT("finalPrice") * 100.0 / COUNT(*)), 2) as porcentaje_congelados
FROM "Product" 
WHERE saleprice IS NOT NULL 
AND vat IS NOT NULL;

-- 4. Verificar el producto FULL DAY ADULTO específicamente
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
    CASE 
        WHEN "finalPrice" IS NOT NULL THEN 'CONGELADO'
        ELSE 'NO CONGELADO'
    END as estado_precio
FROM "Product" 
WHERE id = 1176 OR name ILIKE '%FULL DAY ADULTO%'; 
-- Script de prueba para verificar el sistema de precios congelados
-- Objetivo: Verificar que los precios se muestren correctamente en la interfaz

-- 1. Verificar productos con precios congelados (deberían mostrar precio final)
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
    CASE 
        WHEN "finalPrice" IS NOT NULL AND "finalPrice" > 0 THEN 'CONGELADO'
        ELSE 'NO CONGELADO'
    END as estado_precio,
    CASE 
        WHEN "finalPrice" IS NOT NULL AND "finalPrice" > 0 THEN "finalPrice"
        ELSE ROUND(saleprice * (1 + vat/100))
    END as precio_a_mostrar
FROM "Product" 
WHERE "finalPrice" IS NOT NULL 
AND "finalPrice" > 0
ORDER BY "finalPrice" DESC
LIMIT 10;

-- 2. Verificar productos sin precios congelados (deberían mostrar precio calculado)
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
    CASE 
        WHEN "finalPrice" IS NOT NULL AND "finalPrice" > 0 THEN 'CONGELADO'
        ELSE 'NO CONGELADO'
    END as estado_precio,
    CASE 
        WHEN "finalPrice" IS NOT NULL AND "finalPrice" > 0 THEN "finalPrice"
        ELSE ROUND(saleprice * (1 + vat/100))
    END as precio_a_mostrar
FROM "Product" 
WHERE ("finalPrice" IS NULL OR "finalPrice" = 0)
AND saleprice IS NOT NULL 
AND vat IS NOT NULL
ORDER BY saleprice DESC
LIMIT 10;

-- 3. Verificar productos específicos mencionados en el chat
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
    CASE 
        WHEN "finalPrice" IS NOT NULL AND "finalPrice" > 0 THEN 'CONGELADO'
        ELSE 'NO CONGELADO'
    END as estado_precio,
    CASE 
        WHEN "finalPrice" IS NOT NULL AND "finalPrice" > 0 THEN "finalPrice"
        ELSE ROUND(saleprice * (1 + vat/100))
    END as precio_a_mostrar
FROM "Product" 
WHERE id IN (1176, 1186, 268, 270, 260, 265, 264, 262, 261, 266, 267)
ORDER BY id;

-- 4. Estadísticas del sistema de precios congelados
SELECT 
    'ESTADÍSTICAS DEL SISTEMA' as tipo,
    COUNT(*) as total_productos,
    COUNT("finalPrice") as productos_congelados,
    COUNT(*) - COUNT("finalPrice") as productos_no_congelados,
    ROUND((COUNT("finalPrice") * 100.0 / COUNT(*)), 2) as porcentaje_congelados
FROM "Product" 
WHERE saleprice IS NOT NULL 
AND vat IS NOT NULL

UNION ALL

SELECT 
    'PRECIOS MÁS ALTOS CONGELADOS' as tipo,
    COUNT(*) as total_productos,
    COUNT("finalPrice") as productos_congelados,
    COUNT(*) - COUNT("finalPrice") as productos_no_congelados,
    ROUND((COUNT("finalPrice") * 100.0 / COUNT(*)), 2) as porcentaje_congelados
FROM "Product" 
WHERE "finalPrice" IS NOT NULL 
AND "finalPrice" > 50000; 
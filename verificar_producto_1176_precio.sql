-- Script para verificar el precio del producto 1176 (FULL DAY ADULTO)
-- Objetivo: Identificar por qué hay diferencia entre $55,000 y $54,999

-- 1. Verificar datos exactos del producto 1176
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
    saleprice * (1 + vat/100) as precio_sin_redondear,
    CASE 
        WHEN "finalPrice" IS NOT NULL AND "finalPrice" > 0 THEN 'CONGELADO'
        ELSE 'NO CONGELADO'
    END as estado_precio
FROM "Product" 
WHERE id = 1176;

-- 2. Verificar si hay otros productos con el mismo problema
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
    saleprice * (1 + vat/100) as precio_sin_redondear,
    CASE 
        WHEN "finalPrice" IS NOT NULL AND "finalPrice" > 0 THEN 'CONGELADO'
        ELSE 'NO CONGELADO'
    END as estado_precio
FROM "Product" 
WHERE "finalPrice" IS NOT NULL 
AND "finalPrice" > 0
AND ROUND(saleprice * (1 + vat/100)) != "finalPrice"
ORDER BY id;

-- 3. Verificar productos con precios similares a $55,000
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
    saleprice * (1 + vat/100) as precio_sin_redondear
FROM "Product" 
WHERE "finalPrice" BETWEEN 54000 AND 56000
ORDER BY "finalPrice";

-- 4. Verificar si el problema está en el cálculo
SELECT 
    'CÁLCULO MANUAL' as tipo,
    46218 as precio_neto,
    19 as vat,
    46218 * (1 + 19/100) as precio_sin_redondear,
    ROUND(46218 * (1 + 19/100)) as precio_redondeado,
    55000 as precio_congelado 
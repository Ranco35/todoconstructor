-- Script para verificar que el precio congelado esté correctamente guardado
-- Objetivo: Confirmar que el producto 1176 tenga finalPrice = 55000

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
    END as estado_precio,
    CASE 
        WHEN "finalPrice" IS NOT NULL AND "finalPrice" > 0 THEN "finalPrice"
        ELSE ROUND(saleprice * (1 + vat/100))
    END as precio_a_mostrar_en_tabla
FROM "Product" 
WHERE id = 1176;

-- 2. Forzar actualización del precio congelado
UPDATE "Product" 
SET "finalPrice" = 55000
WHERE id = 1176;

-- 3. Verificar después de la actualización
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
    END as precio_a_mostrar_en_tabla
FROM "Product" 
WHERE id = 1176;

-- 4. Verificar que no haya otros productos con el mismo problema
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
    END as estado_precio
FROM "Product" 
WHERE "finalPrice" IS NOT NULL 
AND "finalPrice" > 0
AND ROUND(saleprice * (1 + vat/100)) != "finalPrice"
ORDER BY id; 
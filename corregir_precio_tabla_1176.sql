-- Script para verificar y corregir el precio del producto 1176
-- Objetivo: Asegurar que el precio congelado se muestre correctamente en la tabla

-- 1. Verificar datos actuales del producto 1176
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

-- 2. Verificar que el precio congelado esté correcto
UPDATE "Product" 
SET "finalPrice" = 55000
WHERE id = 1176 
AND ("finalPrice" IS NULL OR "finalPrice" != 55000);

-- 3. Verificar después de la corrección
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

-- 4. Verificar otros productos con precios congelados
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
WHERE "finalPrice" IS NOT NULL 
AND "finalPrice" > 0
ORDER BY "finalPrice" DESC
LIMIT 10; 